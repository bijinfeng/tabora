import type { AiChatAttachmentResource } from "@tabora/plugin-api/sdk"
import type { MultimodalContent, UIMessage } from "@tanstack/ai-client"

const MAX_INLINE_IMAGE_BYTES = 4 * 1024 * 1024
/** Base64 expands by about 4/3; keep this below the gateway's 12 MB character budget. */
const MAX_INLINE_MEDIA_BYTES = 8 * 1024 * 1024
export const AI_CHAT_ATTACHMENT_METADATA = "tabora.ai-chat.attachments"

export type AiChatAttachment = {
  name: string
  size: number
  mimeType: string
  kind: "archive" | "audio" | "document" | "file" | "image" | "text"
  status: "provided" | "unavailable"
  detail: string
  resourceId?: string
  preview?: string
}

export type AiChatInputModality = "text" | "image" | "audio" | "document"

export type AiChatAttachmentMetadata = {
  displayText: string
  attachments: AiChatAttachment[]
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function extension(name: string): string | undefined {
  return name.split(".").at(-1)?.toLowerCase()
}

function isZipAttachment(file: File): boolean {
  return file.type === "application/zip" || extension(file.name) === "zip"
}

function isPdfAttachment(file: File): boolean {
  return file.type.split(";", 1)[0]?.toLowerCase() === "application/pdf"
}

async function readBase64(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ""
  const chunkSize = 0x8000
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize))
  }
  return btoa(binary)
}

export function attachmentMetadata(message: UIMessage): AiChatAttachmentMetadata | undefined {
  const value = message.metadata?.[AI_CHAT_ATTACHMENT_METADATA]
  if (!value || typeof value !== "object") return undefined
  const record = value as Partial<AiChatAttachmentMetadata>
  if (typeof record.displayText !== "string" || !Array.isArray(record.attachments)) return undefined
  return record as AiChatAttachmentMetadata
}

/**
 * Builds model input and a separate UI descriptor. User-visible text stays
 * untouched. Text and archives become host-owned agent resources instead of
 * being expanded into the prompt in the browser.
 */
export async function buildAttachmentContent(
  prompt: string,
  files: File[],
  inputModalities: AiChatInputModality[] = ["text", "image"],
  toolResources: readonly AiChatAttachmentResource[] = [],
): Promise<string | MultimodalContent> {
  if (files.length === 0) return prompt

  const attachments: AiChatAttachment[] = []
  const imageParts: Array<{
    type: "image"
    source: { type: "data"; value: string; mimeType: string }
  }> = []
  const audioParts: Array<{
    type: "audio"
    source: { type: "data"; value: string; mimeType: string }
  }> = []
  const documentParts: Array<{
    type: "document"
    source: { type: "data"; value: string; mimeType: string }
    metadata: { filename: string }
  }> = []
  const supported = new Set(inputModalities)
  let remainingMediaBytes = MAX_INLINE_MEDIA_BYTES

  for (const [index, file] of files.entries()) {
    const resource = toolResources[index]
    const resourceMetadata = resource ? { resourceId: resource.id } : {}
    if (file.type.startsWith("image/")) {
      if (!supported.has("image")) {
        attachments.push({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          kind: "image",
          status: "unavailable",
          detail: "当前模型不支持图片输入，未提供给模型",
          ...resourceMetadata,
        })
        continue
      }
      if (file.size > MAX_INLINE_IMAGE_BYTES) {
        attachments.push({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          kind: "image",
          status: "unavailable",
          detail: "图片超过 4 MB，未提供给模型",
          ...resourceMetadata,
        })
        continue
      }
      if (file.size > remainingMediaBytes) {
        attachments.push({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          kind: "image",
          status: "unavailable",
          detail: "附件媒体总量超过 8 MB，未提供给模型",
          ...resourceMetadata,
        })
        continue
      }
      try {
        imageParts.push({
          type: "image",
          source: { type: "data", value: await readBase64(file), mimeType: file.type },
        })
        attachments.push({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          kind: "image",
          status: "provided",
          detail: "图片已提供给模型",
          ...resourceMetadata,
        })
        remainingMediaBytes -= file.size
      } catch {
        attachments.push({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          kind: "image",
          status: "unavailable",
          detail: "图片读取失败，未提供给模型",
          ...resourceMetadata,
        })
      }
      continue
    }

    if (file.type.startsWith("audio/")) {
      if (!supported.has("audio")) {
        attachments.push({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          kind: "audio",
          status: "unavailable",
          detail: "当前模型不支持音频输入，未提供给模型",
          ...resourceMetadata,
        })
        continue
      }
      if (file.size > MAX_INLINE_IMAGE_BYTES) {
        attachments.push({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          kind: "audio",
          status: "unavailable",
          detail: "音频超过 4 MB，未提供给模型",
          ...resourceMetadata,
        })
        continue
      }
      if (file.size > remainingMediaBytes) {
        attachments.push({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          kind: "audio",
          status: "unavailable",
          detail: "附件媒体总量超过 8 MB，未提供给模型",
          ...resourceMetadata,
        })
        continue
      }
      try {
        audioParts.push({
          type: "audio",
          source: { type: "data", value: await readBase64(file), mimeType: file.type },
        })
        attachments.push({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          kind: "audio",
          status: "provided",
          detail: "音频已提供给模型",
          ...resourceMetadata,
        })
        remainingMediaBytes -= file.size
      } catch {
        attachments.push({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          kind: "audio",
          status: "unavailable",
          detail: "音频读取失败，未提供给模型",
          ...resourceMetadata,
        })
      }
      continue
    }

    if (isPdfAttachment(file)) {
      if (!supported.has("document")) {
        attachments.push({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          kind: "document",
          status: "unavailable",
          detail: "当前模型不支持 PDF 输入，未提供给模型",
          ...resourceMetadata,
        })
        continue
      }
      if (file.size > MAX_INLINE_IMAGE_BYTES) {
        attachments.push({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          kind: "document",
          status: "unavailable",
          detail: "PDF 超过 4 MB，未提供给模型",
          ...resourceMetadata,
        })
        continue
      }
      if (file.size > remainingMediaBytes) {
        attachments.push({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          kind: "document",
          status: "unavailable",
          detail: "附件媒体总量超过 8 MB，未提供给模型",
          ...resourceMetadata,
        })
        continue
      }
      try {
        documentParts.push({
          type: "document",
          source: { type: "data", value: await readBase64(file), mimeType: file.type },
          metadata: { filename: file.name },
        })
        attachments.push({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          kind: "document",
          status: "provided",
          detail: "PDF 已提供给模型",
          ...resourceMetadata,
        })
        remainingMediaBytes -= file.size
      } catch {
        attachments.push({
          name: file.name,
          size: file.size,
          mimeType: file.type,
          kind: "document",
          status: "unavailable",
          detail: "PDF 读取失败，未提供给模型",
          ...resourceMetadata,
        })
      }
      continue
    }

    const kind = isZipAttachment(file) ? "archive" : file.type.startsWith("text/") ? "text" : "file"
    attachments.push({
      name: file.name,
      size: file.size,
      mimeType: file.type,
      kind,
      status: resource ? "provided" : "unavailable",
      detail: resource
        ? kind === "archive"
          ? "压缩包可由 AI 按需浏览和读取"
          : "文件可由 AI 按需读取"
        : "当前宿主未提供可读取的附件资源",
      ...resourceMetadata,
    })
  }

  return {
    content: [{ type: "text", content: prompt }, ...imageParts, ...audioParts, ...documentParts],
    metadata: {
      [AI_CHAT_ATTACHMENT_METADATA]: {
        displayText: prompt,
        attachments,
      } satisfies AiChatAttachmentMetadata,
    },
  }
}
