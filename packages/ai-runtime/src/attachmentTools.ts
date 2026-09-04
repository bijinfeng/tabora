import { Unzip, UnzipInflate } from "fflate"
import { toolDefinition, type AnyServerTool } from "@tanstack/ai"

const MAX_ATTACHMENT_BYTES = 32 * 1024 * 1024
const MAX_ARCHIVE_ENTRIES = 512
const MAX_ARCHIVE_ENTRY_BYTES = 1024 * 1024
const MAX_READ_BYTES = 24 * 1024
const TEXT_EXTENSIONS = new Set([
  "c",
  "cc",
  "cpp",
  "css",
  "csv",
  "html",
  "js",
  "json",
  "md",
  "py",
  "rs",
  "sql",
  "ts",
  "tsx",
  "txt",
  "xml",
  "yaml",
  "yml",
])

export type AiAttachmentToolResource = {
  id: string
  filename: string
  mimeType: string
  size: number
  /** Reads a bounded byte range; the implementation stays host-private. */
  read(range: { offset: number; length: number }): Promise<Uint8Array>
}

type ArchiveEntry = { path: string; size: number }

function extension(name: string): string | undefined {
  return name.split(".").at(-1)?.toLowerCase()
}

function isTextResource(resource: AiAttachmentToolResource): boolean {
  const ext = extension(resource.filename)
  return resource.mimeType.startsWith("text/") || Boolean(ext && TEXT_EXTENSIONS.has(ext))
}

function isArchiveResource(resource: AiAttachmentToolResource): boolean {
  return resource.mimeType === "application/zip" || extension(resource.filename) === "zip"
}

function isSafeArchivePath(path: string): boolean {
  return (
    Boolean(path) &&
    !path.includes("\0") &&
    !path.startsWith("/") &&
    !path.startsWith("\\") &&
    !path.split(/[\\/]/).some((part) => part === "..")
  )
}

function boundedNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : fallback
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

function toolFailure(message: string) {
  return { ok: false as const, error: message }
}

async function archiveBytes(resource: AiAttachmentToolResource): Promise<Uint8Array | undefined> {
  if (!isArchiveResource(resource)) return undefined
  if (resource.size < 1 || resource.size > MAX_ATTACHMENT_BYTES) return undefined
  const bytes = await resource.read({ offset: 0, length: resource.size })
  return bytes.length === resource.size ? bytes : undefined
}

function listArchiveEntries(bytes: Uint8Array): ArchiveEntry[] | undefined {
  const entries: ArchiveEntry[] = []
  const archive = new Unzip((entry) => {
    if (
      entries.length >= MAX_ARCHIVE_ENTRIES ||
      !isSafeArchivePath(entry.name) ||
      entry.name.endsWith("/")
    ) {
      return
    }
    const size = entry.originalSize ?? 0
    if (size <= MAX_ARCHIVE_ENTRY_BYTES) entries.push({ path: entry.name, size })
  })
  archive.register(UnzipInflate)
  try {
    archive.push(bytes, true)
    return entries
  } catch {
    return undefined
  }
}

function readArchiveEntry(bytes: Uint8Array, targetPath: string, offset: number, length: number) {
  return new Promise<{ content: string; truncated: boolean; nextOffset?: number } | undefined>(
    (resolve) => {
      let settled = false
      const finish = (
        value: { content: string; truncated: boolean; nextOffset?: number } | undefined,
      ) => {
        if (!settled) {
          settled = true
          resolve(value)
        }
      }
      const archive = new Unzip((entry) => {
        if (entry.name !== targetPath || !isSafeArchivePath(entry.name)) return
        if ((entry.originalSize ?? 0) > MAX_ARCHIVE_ENTRY_BYTES) return finish(undefined)
        let position = 0
        let retained = ""
        let truncated = false
        const decoder = new TextDecoder()
        entry.ondata = (error, chunk, final) => {
          if (error) return finish(undefined)
          const nextPosition = position + chunk.length
          const startsAt = Math.max(0, offset - position)
          const endsAt = Math.min(chunk.length, offset + length - position)
          if (endsAt > startsAt)
            retained += decoder.decode(chunk.subarray(startsAt, endsAt), { stream: !final })
          position = nextPosition
          if (position >= offset + length) {
            const originalSize = entry.originalSize ?? Number.MAX_SAFE_INTEGER
            truncated = offset + length < originalSize
            entry.terminate()
            return finish({
              content: retained,
              truncated,
              ...(truncated ? { nextOffset: offset + length } : {}),
            })
          }
          if (final) finish({ content: retained, truncated: false })
        }
        entry.start()
      })
      archive.register(UnzipInflate)
      try {
        archive.push(bytes, true)
        queueMicrotask(() => finish(undefined))
      } catch {
        finish(undefined)
      }
    },
  )
}

/**
 * Server-side, read-only attachment tools. Models only see opaque IDs and
 * bounded text; storage keys, local paths, and private asset URLs never leave
 * the host process.
 */
export function createAttachmentTools(
  resources: readonly AiAttachmentToolResource[],
): AnyServerTool[] {
  const byId = new Map(resources.map((resource) => [resource.id, resource]))
  if (byId.size === 0) return []

  const list = toolDefinition({
    name: "list_attachments",
    description: "List files attached to this conversation before reading one.",
    inputSchema: { type: "object", additionalProperties: false },
  }).server(async () => ({
    attachments: [...byId.values()].map(({ id, filename, mimeType, size }) => ({
      id,
      filename,
      mimeType,
      size,
      readable: isTextResource(byId.get(id)!) || isArchiveResource(byId.get(id)!),
      archive: isArchiveResource(byId.get(id)!),
    })),
  }))

  const read = toolDefinition({
    name: "read_attachment",
    description: "Read a bounded UTF-8 byte range from a text attachment.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        offset: { type: "integer", minimum: 0 },
        length: { type: "integer", minimum: 1 },
      },
      required: ["id"],
      additionalProperties: false,
    },
  }).server(async (input) => {
    const args = record(input)
    const resource = typeof args.id === "string" ? byId.get(args.id) : undefined
    if (!resource || !isTextResource(resource))
      return toolFailure("Attachment is not a readable text file")
    const offset = boundedNumber(args.offset, 0)
    const length = Math.min(Math.max(1, boundedNumber(args.length, MAX_READ_BYTES)), MAX_READ_BYTES)
    const bytes = await resource.read({ offset, length })
    const content = new TextDecoder().decode(bytes)
    const nextOffset = offset + bytes.length
    return {
      ok: true as const,
      content,
      offset,
      truncated: nextOffset < resource.size,
      ...(nextOffset < resource.size ? { nextOffset } : {}),
    }
  })

  const listArchive = toolDefinition({
    name: "list_archive_entries",
    description: "List safe, bounded entries in a ZIP attachment before reading an entry.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
      additionalProperties: false,
    },
  }).server(async (input) => {
    const args = record(input)
    const resource = typeof args.id === "string" ? byId.get(args.id) : undefined
    if (!resource) return toolFailure("Attachment is unavailable")
    const bytes = await archiveBytes(resource)
    const entries = bytes ? listArchiveEntries(bytes) : undefined
    if (!entries) return toolFailure("Archive is invalid, too large, or unavailable")
    return { ok: true as const, entries }
  })

  const readArchive = toolDefinition({
    name: "read_archive_entry",
    description: "Read a bounded UTF-8 byte range from one safe ZIP entry.",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        path: { type: "string" },
        offset: { type: "integer", minimum: 0 },
        length: { type: "integer", minimum: 1 },
      },
      required: ["id", "path"],
      additionalProperties: false,
    },
  }).server(async (input) => {
    const args = record(input)
    const resource = typeof args.id === "string" ? byId.get(args.id) : undefined
    if (!resource || typeof args.path !== "string" || !isSafeArchivePath(args.path)) {
      return toolFailure("Archive entry is unavailable")
    }
    const bytes = await archiveBytes(resource)
    if (!bytes) return toolFailure("Archive is invalid, too large, or unavailable")
    const offset = boundedNumber(args.offset, 0)
    const length = Math.min(Math.max(1, boundedNumber(args.length, MAX_READ_BYTES)), MAX_READ_BYTES)
    const result = await readArchiveEntry(bytes, args.path, offset, length)
    return result
      ? { ok: true as const, ...result, offset }
      : toolFailure("Archive entry is unavailable")
  })

  return [list, read, listArchive, readArchive]
}
