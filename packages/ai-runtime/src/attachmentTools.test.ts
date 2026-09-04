import { zipSync } from "fflate"
import { describe, expect, it } from "vitest"

import { createAttachmentTools, type AiAttachmentToolResource } from "./attachmentTools"

function resource(
  id: string,
  filename: string,
  mimeType: string,
  bytes: Uint8Array,
): AiAttachmentToolResource {
  return {
    id,
    filename,
    mimeType,
    size: bytes.length,
    read: async ({ offset, length }) => bytes.slice(offset, offset + length),
  }
}

function execute(tools: ReturnType<typeof createAttachmentTools>, name: string, args: unknown) {
  const tool = tools.find((candidate) => candidate.name === name)
  if (!tool?.execute) throw new Error(`Missing ${name}`)
  return tool.execute(args)
}

describe("attachment tools", () => {
  it("only exposes opaque metadata and bounded text ranges", async () => {
    const tools = createAttachmentTools([
      resource("11", "notes.txt", "text/plain", new TextEncoder().encode("abcdef")),
    ])

    await expect(execute(tools, "list_attachments", {})).resolves.toEqual({
      attachments: [
        {
          id: "11",
          filename: "notes.txt",
          mimeType: "text/plain",
          size: 6,
          readable: true,
          archive: false,
        },
      ],
    })
    await expect(
      execute(tools, "read_attachment", { id: "11", offset: 2, length: 2 }),
    ).resolves.toEqual({
      ok: true,
      content: "cd",
      offset: 2,
      truncated: true,
      nextOffset: 4,
    })
    await expect(execute(tools, "read_attachment", { id: "missing" })).resolves.toEqual({
      ok: false,
      error: "Attachment is not a readable text file",
    })
  })

  it("lists and reads only safe, bounded ZIP entries", async () => {
    const archive = zipSync({
      "src/main.ts": new TextEncoder().encode("export const answer = 42"),
      "../private.txt": new TextEncoder().encode("do not expose"),
    })
    const tools = createAttachmentTools([resource("12", "project.zip", "application/zip", archive)])

    await expect(execute(tools, "list_archive_entries", { id: "12" })).resolves.toEqual({
      ok: true,
      entries: [{ path: "src/main.ts", size: 24 }],
    })
    await expect(
      execute(tools, "read_archive_entry", { id: "12", path: "src/main.ts", length: 6 }),
    ).resolves.toMatchObject({ ok: true, content: "export", offset: 0, truncated: true })
    await expect(
      execute(tools, "read_archive_entry", { id: "12", path: "../private.txt" }),
    ).resolves.toEqual({ ok: false, error: "Archive entry is unavailable" })
  })
})
