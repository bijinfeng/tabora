import type { UIMessage } from "@tanstack/ai-client"
import { AI_CHAT_ATTACHMENT_METADATA, attachmentMetadata } from "../ai-chat-attachments"
import type { AiChatAttachmentMetadata } from "../ai-chat-attachments"

export const CHAT_SYSTEM_PROMPT =
  "你是 Tabora 工作台中的 AI 助手。用与用户相同的语言回答，保持简洁直接，可用 Markdown 组织内容。"

const CONTEXT_WINDOW_TOKENS = 32_000
const MAX_TITLE_CHARS = 24

export type AiChatStoredPart =
  | { type: "text"; text: string }
  | {
      /** Provider-visible reasoning summary. `signature` is opaque continuation state, never UI text. */
      type: "thinking"
      content: string
      signature?: string
    }
  | {
      type: "image" | "audio"
      source: { type: "data"; value: string; mimeType: string } | { type: "url"; value: string }
    }
  | {
      type: "document"
      source: { type: "data"; value: string; mimeType: string } | { type: "url"; value: string }
      metadata?: { filename?: string }
    }

export type AiChatStoredMessage = {
  id: string
  role: "user" | "assistant"
  createdAt: string
  status: "complete" | "error"
  errorCode?: string
  parts: AiChatStoredPart[]
  /** UI-only attachment information; model context remains in the text part. */
  attachmentMetadata?: AiChatAttachmentMetadata
}

export type AiChatContextBlock = {
  id: string
  label: string
  text: string
  /** Compacted history is replaceable; manually added context is always retained. */
  source?: "compaction"
}

export type AiChatReasoningEffort = "low" | "medium" | "high"

export type AiChatStoredConversation = {
  id: string
  title: string
  titleExplicit?: boolean
  /** Set once the model-generated title attempt ran (success or failure). */
  titleModelTried?: boolean
  /** Per-conversation system prompt override; empty when unset. */
  systemPrompt?: string
  /** Per-conversation sampling temperature override. */
  temperature?: number
  /** Per-conversation builtin model id; empty falls back to the workspace default. */
  modelId?: string
  /** Per-conversation reasoning strength for capable models. */
  reasoningEffort?: AiChatReasoningEffort
  /** Per-conversation output cap; also drives the context-capacity control. */
  maxOutputTokens?: number
  /** Extra context blocks appended to the system prompt for this conversation. */
  contextBlocks?: AiChatContextBlock[]
  createdAt: string
  updatedAt: string
  messages: AiChatStoredMessage[]
}

export type AiChatConversationOptions = {
  systemPrompt?: string
  temperature?: number | undefined
  modelId?: string | undefined
  reasoningEffort?: AiChatReasoningEffort | undefined
  maxOutputTokens?: number | undefined
  contextBlocks?: AiChatContextBlock[]
}

export type AiChatConversationMeta = {
  id: string
  title: string
  messageCount: number
  updatedAt: string
  systemPrompt?: string
  temperature?: number
  modelId?: string
  reasoningEffort?: AiChatReasoningEffort
  maxOutputTokens?: number
  contextBlocks?: AiChatContextBlock[]
}

export function messageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; content: string } => part.type === "text")
    .map((part) => part.content)
    .join("")
}

export function newConversationId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function deriveConversationTitle(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim()
  return normalized.length > MAX_TITLE_CHARS
    ? `${normalized.slice(0, MAX_TITLE_CHARS)}…`
    : normalized || "新对话"
}

export function toStoredMessage(
  message: UIMessage,
  status: "complete" | "error" = "complete",
): AiChatStoredMessage {
  const metadata = attachmentMetadata(message)
  const parts: AiChatStoredPart[] = []
  for (const part of message.parts) {
    if (part.type === "text") {
      parts.push({ type: "text", text: part.content })
      continue
    }
    if (part.type === "thinking") {
      const opaque = part as { content: string; signature?: unknown }
      if (!opaque.content || opaque.content.length > 32_000) continue
      if (opaque.signature !== undefined && typeof opaque.signature !== "string") continue
      if (typeof opaque.signature === "string" && opaque.signature.length > 65_536) continue
      parts.push({
        type: "thinking",
        content: opaque.content,
        ...(typeof opaque.signature === "string" ? { signature: opaque.signature } : {}),
      })
      continue
    }
    if (part.type !== "image" && part.type !== "audio" && part.type !== "document") continue
    const source = part.source
    const persistedSource =
      source.type === "data"
        ? { type: "data" as const, value: source.value, mimeType: source.mimeType }
        : { type: "url" as const, value: source.value }
    if (part.type === "document") {
      const documentMetadata =
        part.metadata &&
        typeof part.metadata === "object" &&
        "filename" in part.metadata &&
        typeof part.metadata.filename === "string"
          ? { filename: part.metadata.filename }
          : undefined
      parts.push({
        type: "document",
        source: persistedSource,
        ...(documentMetadata ? { metadata: documentMetadata } : {}),
      })
    } else {
      parts.push({ type: part.type, source: persistedSource })
    }
  }
  return {
    id: message.id,
    role: message.role === "assistant" ? "assistant" : "user",
    createdAt: message.createdAt?.toISOString() ?? new Date().toISOString(),
    status,
    parts: parts.length > 0 ? parts : [{ type: "text", text: messageText(message) }],
    ...(metadata ? { attachmentMetadata: metadata } : {}),
  }
}

export function toUIMessage(stored: AiChatStoredMessage): UIMessage {
  return {
    id: stored.id,
    role: stored.role,
    parts: stored.parts.map((part) => {
      if (part.type === "text") return { type: "text" as const, content: part.text }
      if (part.type === "thinking") {
        return {
          type: "thinking" as const,
          content: part.content,
          ...(part.signature ? { signature: part.signature } : {}),
        }
      }
      if (part.type === "document") {
        return {
          type: "document" as const,
          source: part.source,
          ...(part.metadata ? { metadata: part.metadata } : {}),
        }
      }
      return { type: part.type, source: part.source }
    }),
    ...(stored.attachmentMetadata
      ? { metadata: { [AI_CHAT_ATTACHMENT_METADATA]: stored.attachmentMetadata } }
      : {}),
  }
}

export function composeSystemPrompt(
  conversation: Pick<AiChatStoredConversation, "systemPrompt" | "contextBlocks">,
): string {
  const base = conversation.systemPrompt?.trim() || CHAT_SYSTEM_PROMPT
  const contextBlocks = conversation.contextBlocks ?? []
  if (contextBlocks.length === 0) return base
  const rendered = contextBlocks
    .map((block) => `# ${block.label.trim() || "上下文"}\n${block.text.trim()}`)
    .join("\n\n")
  return `${base}\n\n以下是本次对话的附加上下文：\n\n${rendered}`
}

export type AiChatContextUsage = {
  usedTokens: number
  windowTokens: number
  percent: number
}

/** Estimate the visible context window, reserving a conservative budget for media. */
export function estimateContextUsage(
  conversation: Pick<AiChatStoredConversation, "systemPrompt" | "contextBlocks"> | undefined,
  messages: UIMessage[],
  pending?: string,
): AiChatContextUsage {
  const systemChars = conversation
    ? composeSystemPrompt(conversation).length
    : CHAT_SYSTEM_PROMPT.length
  const messageChars = messages.reduce((total, message) => total + messageText(message).length, 0)
  const mediaChars = messages.reduce(
    (total, message) =>
      total +
      message.parts.reduce(
        (sum, part) =>
          sum +
          ((part.type === "image" || part.type === "audio" || part.type === "document") &&
          part.source.type === "data"
            ? part.source.value.length
            : 0),
        0,
      ),
    0,
  )
  const usedTokens = Math.max(
    1,
    Math.ceil((systemChars + messageChars + (pending?.length ?? 0)) / 4) +
      Math.ceil(mediaChars / 1_000),
  )
  return {
    usedTokens,
    windowTokens: CONTEXT_WINDOW_TOKENS,
    percent: Math.min(100, Math.round((usedTokens / CONTEXT_WINDOW_TOKENS) * 100)),
  }
}

export function buildSendOptions(
  conversation: AiChatStoredConversation,
  attachmentIds: string[] = [],
): {
  system: string
  temperature?: number
  maxOutputTokens?: number
  modelId?: string
  reasoningEffort?: AiChatReasoningEffort
  attachmentIds?: string[]
} {
  return {
    system: composeSystemPrompt(conversation),
    ...(conversation.temperature === undefined ? {} : { temperature: conversation.temperature }),
    ...(conversation.maxOutputTokens === undefined
      ? {}
      : { maxOutputTokens: conversation.maxOutputTokens }),
    ...(conversation.modelId ? { modelId: conversation.modelId } : {}),
    ...(conversation.reasoningEffort ? { reasoningEffort: conversation.reasoningEffort } : {}),
    ...(attachmentIds.length ? { attachmentIds } : {}),
  }
}

export const MAX_CONVERSATION_TITLE_CHARS = MAX_TITLE_CHARS
