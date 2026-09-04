import { ChatClient } from "@tanstack/ai-client"
import type {
  ConnectionAdapter,
  MultimodalContent,
  QueuedMessage,
  UIMessage,
} from "@tanstack/ai-client"
import { createSignal } from "solid-js"
import type { Accessor } from "solid-js"
import { AiRuntimeError } from "@tabora/plugin-api/sdk"
import type { AiRuntimeBridge, WidgetViewData } from "@tabora/plugin-api/sdk"
import { AI_CHAT_ATTACHMENT_METADATA, attachmentMetadata } from "./ai-chat-attachments"
import type { AiChatAttachmentMetadata } from "./ai-chat-attachments"

const CHAT_SYSTEM_PROMPT =
  "你是 Tabora 工作台中的 AI 助手。用与用户相同的语言回答，保持简洁直接，可用 Markdown 组织内容。"

/** Leave the gateway's 32k message budget available for the next user turn. */
const HISTORY_MAX_MESSAGES = 99
const HISTORY_MAX_CHARS = 64_000
const HISTORY_MAX_MEDIA_CHARS = 8_000_000

const STORAGE_KEY = "ai-chat-conversations"
const MAX_TITLE_CHARS = 24
const SAVE_DEBOUNCE_MS = 250

let aiRuntime: AiRuntimeBridge | undefined
let openAiSettings: ((sectionId?: string) => void) | undefined

export function setAiChatRuntime(runtime: AiRuntimeBridge | undefined) {
  aiRuntime = runtime
}

/** Files are uploaded through the host bridge; plugins never receive storage paths or URLs. */
export async function prepareAiChatAttachments(files: readonly File[], conversationId: string) {
  return aiRuntime?.prepareChatAttachments?.(files, { conversationId }) ?? []
}

export function setAiChatSettingsOpener(opener: ((sectionId?: string) => void) | undefined) {
  openAiSettings = opener
}

export function getAiChatSettingsOpener(): ((sectionId?: string) => void) | undefined {
  return openAiSettings
}

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

export type AiChatSession = {
  loaded: Accessor<boolean>
  conversations: Accessor<AiChatConversationMeta[]>
  activeId: Accessor<string | null>
  messages: Accessor<UIMessage[]>
  isLoading: Accessor<boolean>
  queuedCount: Accessor<number>
  queuedMessages: Accessor<QueuedMessage[]>
  error: Accessor<Error | undefined>
  historyTrimmed: Accessor<boolean>
  send(content: string | MultimodalContent): Promise<void>
  /** Interrupt the active generation and dispatch this turn without queueing it. */
  sendImmediately(content: string | MultimodalContent): Promise<void>
  stop(): void
  cancelQueued(id: string): void
  clear(): void
  retry(): Promise<void>
  startNewConversation(): void
  createConversation(): string
  switchConversation(id: string): void
  renameConversation(id: string, title: string): void
  deleteConversation(id: string): void
  updateConversationOptions(id: string, options: AiChatConversationOptions): void
  /** Replace the last user message and regenerate the reply from it. */
  editLastUserMessage(text: string): Promise<void>
}

const sessions = new Map<string, AiChatSession>()

type AiChatViewEntry = {
  instanceId: string
  session: AiChatSession
  openExpand: () => void
}

/** Views registered in mount order; the palette command targets the latest. */
const viewEntries: AiChatViewEntry[] = []

export function registerAiChatView(entry: AiChatViewEntry): () => void {
  viewEntries.push(entry)
  return () => {
    const index = viewEntries.indexOf(entry)
    if (index >= 0) viewEntries.splice(index, 1)
  }
}

/** Command entry: start a fresh conversation in the newest AI chat widget. */
export function runNewConversationCommand(instanceId?: string): void {
  const entry =
    (instanceId
      ? viewEntries.find((candidate) => candidate.instanceId === instanceId)
      : undefined) ?? viewEntries.at(-1)
  if (!entry) {
    // The palette layer turns handler errors into a visible toast.
    throw new Error("请先添加 AI 对话卡片")
  }
  entry.session.startNewConversation()
  entry.openExpand()
}

export function messageText(message: UIMessage): string {
  return message.parts
    .filter((part): part is { type: "text"; content: string } => part.type === "text")
    .map((part) => part.content)
    .join("")
}

function newId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `chat-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function deriveTitle(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim()
  return normalized.length > MAX_TITLE_CHARS
    ? `${normalized.slice(0, MAX_TITLE_CHARS)}…`
    : normalized || "新对话"
}

function toStoredMessage(
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
      const metadata =
        part.metadata &&
        typeof part.metadata === "object" &&
        "filename" in part.metadata &&
        typeof part.metadata.filename === "string"
          ? { filename: part.metadata.filename }
          : undefined
      parts.push({ type: "document", source: persistedSource, ...(metadata ? { metadata } : {}) })
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

function toUIMessage(stored: AiChatStoredMessage): UIMessage {
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

export function trimHistory(history: UIMessage[]): UIMessage[] | undefined {
  if (history.length <= 2) return undefined
  let start = history.length > HISTORY_MAX_MESSAGES ? history.length - HISTORY_MAX_MESSAGES : 0
  let total = 0
  let totalMedia = 0
  for (const message of history) {
    total += messageText(message).length
    totalMedia += message.parts.reduce(
      (sum, part) =>
        sum +
        ((part.type === "image" || part.type === "audio" || part.type === "document") &&
        part.source.type === "data"
          ? part.source.value.length
          : 0),
      0,
    )
  }
  while (
    start < history.length - 2 &&
    (total > HISTORY_MAX_CHARS || totalMedia > HISTORY_MAX_MEDIA_CHARS)
  ) {
    total -= messageText(history[start]!).length
    totalMedia -= history[start]!.parts.reduce(
      (sum, part) =>
        sum +
        ((part.type === "image" || part.type === "audio" || part.type === "document") &&
        part.source.type === "data"
          ? part.source.value.length
          : 0),
      0,
    )
    start += 1
  }
  return start === 0 ? undefined : history.slice(start)
}

function composeSystemPrompt(conversation: AiChatStoredConversation): string {
  const base = conversation.systemPrompt?.trim() || CHAT_SYSTEM_PROMPT
  const contextBlocks = conversation.contextBlocks ?? []
  if (contextBlocks.length === 0) return base
  const rendered = contextBlocks
    .map((block) => `# ${block.label.trim() || "上下文"}\n${block.text.trim()}`)
    .join("\n\n")
  return `${base}\n\n以下是本次对话的附加上下文：\n\n${rendered}`
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

function attachmentIds(messages: UIMessage[], content?: string | MultimodalContent): string[] {
  const ids = new Set<string>()
  for (const message of messages) {
    for (const attachment of attachmentMetadata(message)?.attachments ?? []) {
      if (attachment.resourceId) ids.add(attachment.resourceId)
    }
  }
  if (content && typeof content !== "string") {
    for (const attachment of attachmentMetadata({ metadata: content.metadata } as UIMessage)
      ?.attachments ?? []) {
      if (attachment.resourceId) ids.add(attachment.resourceId)
    }
  }
  return [...ids]
}

/**
 * TanStack stream plumbing wraps fetch failures (e.g. StreamReadError); the
 * normalized AiRuntimeError rides the cause chain and is surfaced to views.
 */
function unwrapAiError(error: Error): Error {
  let current: unknown = error
  while (current instanceof Error) {
    if (current instanceof AiRuntimeError) return current
    current = (current as { cause?: unknown }).cause
  }
  return error
}

/**
 * One session per widget instance: the conversation store persists through
 * instance data, and each conversation owns a lazily created ChatClient so
 * the widget card and expand overlay always render the same active thread.
 */
export function getAiChatSession(options: {
  instanceId: string
  data: WidgetViewData
}): AiChatSession {
  const existing = sessions.get(options.instanceId)
  if (existing) return existing

  const connection = aiRuntime?.createChatConnection?.()
  // The host adapter is a TanStack ConnectionAdapter by construction; the
  // plugin-api protocol stays TanStack-free, so bridge it with one structural cast.
  const adapter = connection ? (connection as unknown as ConnectionAdapter) : undefined

  const [loaded, setLoaded] = createSignal(false)
  const [store, setStore] = createSignal<AiChatStoredConversation[]>([])
  const [activeId, setActiveId] = createSignal<string | null>(null)
  const [messages, setMessages] = createSignal<UIMessage[]>([])
  const [isLoading, setLoading] = createSignal(false)
  const [queuedCount, setQueuedCount] = createSignal(0)
  const [queuedMessages, setQueuedMessages] = createSignal<QueuedMessage[]>([])
  const [error, setError] = createSignal<Error | undefined>(undefined)
  const [historyTrimmed, setHistoryTrimmed] = createSignal(false)

  const clients = new Map<string, ChatClient>()
  let saveTimer: ReturnType<typeof setTimeout> | undefined

  function scheduleSave() {
    if (saveTimer) clearTimeout(saveTimer)
    saveTimer = setTimeout(() => {
      saveTimer = undefined
      void options.data.save(STORAGE_KEY, store())
    }, SAVE_DEBOUNCE_MS)
  }

  /** Structural changes persist immediately; streaming updates use the debounce. */
  function persistNow() {
    if (saveTimer) {
      clearTimeout(saveTimer)
      saveTimer = undefined
    }
    void options.data.save(STORAGE_KEY, store())
  }

  function autoTitle(conversation: AiChatStoredConversation): string {
    if (conversation.titleExplicit || conversation.titleModelTried) return conversation.title
    const firstUser = conversation.messages.find((message) => message.role === "user")
    const firstText = firstUser?.parts.find((part) => part.type === "text")
    return deriveTitle(firstText?.text ?? "")
  }

  function syncMessages(conversationId: string, next: UIMessage[]) {
    setStore((list) =>
      list.map((conversation) =>
        conversation.id === conversationId
          ? {
              ...conversation,
              title: autoTitle({
                ...conversation,
                messages: next.map((message) => toStoredMessage(message)),
              }),
              updatedAt: new Date().toISOString(),
              messages: next.map((message) => toStoredMessage(message)),
            }
          : conversation,
      ),
    )
    scheduleSave()
    void maybeGenerateTitle(conversationId, next)
  }

  /** Replace the raw first-question title with a model-written one, once. */
  async function maybeGenerateTitle(conversationId: string, next: UIMessage[]) {
    const conversation = store().find((candidate) => candidate.id === conversationId)
    if (
      !conversation ||
      conversation.titleExplicit ||
      conversation.titleModelTried ||
      conversation.systemPrompt ||
      next.length < 2 ||
      next.length > 4
    ) {
      return
    }
    const firstUser = next.find((message) => message.role === "user")
    const firstAssistant = next.find((message) => message.role === "assistant")
    if (!firstUser || !firstAssistant) return
    const userText = messageText(firstUser)
    const assistantText = messageText(firstAssistant)
    if (!userText.trim() || !assistantText.trim()) return
    setStore((list) =>
      list.map((candidate) =>
        candidate.id === conversationId ? { ...candidate, titleModelTried: true } : candidate,
      ),
    )
    scheduleSave()
    try {
      const result = await aiRuntime?.generate({
        prompt: `根据这段对话写一个不超过12个字的标题，直接输出标题本身，不要引号和标点结尾：\n用户：${userText.slice(0, 500)}\n助手：${assistantText.slice(0, 500)}`,
        system: CHAT_SYSTEM_PROMPT,
        maxOutputTokens: 40,
      })
      const title = deriveTitle(result?.text ?? "")
      if (!title || title === "新对话") return
      setStore((list) =>
        list.map((candidate) =>
          candidate.id === conversationId && !candidate.titleExplicit
            ? { ...candidate, title, updatedAt: new Date().toISOString() }
            : candidate,
        ),
      )
      scheduleSave()
    } catch {
      // Title generation is best-effort; the derived title stays in place.
    }
  }

  function ensureClient(conversation: AiChatStoredConversation): ChatClient | undefined {
    const existingClient = clients.get(conversation.id)
    if (existingClient) return existingClient
    if (!adapter) return undefined
    const client = new ChatClient({
      connection: adapter,
      initialMessages: conversation.messages.map(toUIMessage),
      onMessagesChange: (next) => {
        syncMessages(conversation.id, next)
        if (activeId() === conversation.id) setMessages(next)
      },
      onLoadingChange: (loading) => {
        if (activeId() === conversation.id) setLoading(loading)
      },
      onQueueChange: (queue) => {
        if (activeId() === conversation.id) {
          setQueuedCount(queue.length)
          setQueuedMessages(queue)
        }
      },
      onError: (next) => {
        if (activeId() === conversation.id) setError(next ? unwrapAiError(next) : undefined)
      },
    })
    clients.set(conversation.id, client)
    return client
  }

  function conversationMeta(conversation: AiChatStoredConversation): AiChatConversationMeta {
    return {
      id: conversation.id,
      title: conversation.title,
      messageCount: conversation.messages.length,
      updatedAt: conversation.updatedAt,
      ...(conversation.systemPrompt ? { systemPrompt: conversation.systemPrompt } : {}),
      ...(conversation.temperature !== undefined ? { temperature: conversation.temperature } : {}),
      ...(conversation.modelId ? { modelId: conversation.modelId } : {}),
      ...(conversation.reasoningEffort ? { reasoningEffort: conversation.reasoningEffort } : {}),
      ...(conversation.maxOutputTokens !== undefined
        ? { maxOutputTokens: conversation.maxOutputTokens }
        : {}),
      ...(conversation.contextBlocks?.length ? { contextBlocks: conversation.contextBlocks } : {}),
    }
  }

  function activeConversation(): AiChatStoredConversation | undefined {
    return store().find((conversation) => conversation.id === activeId())
  }

  function activate(conversationId: string) {
    const conversation = store().find((candidate) => candidate.id === conversationId)
    if (!conversation) return
    setActiveId(conversationId)
    setError(undefined)
    setHistoryTrimmed(false)
    const client = ensureClient(conversation)
    setMessages(client ? client.getMessages() : conversation.messages.map(toUIMessage))
    setLoading(client ? client.getIsLoading() : false)
    setQueuedCount(client ? client.getQueue().length : 0)
    setQueuedMessages(client ? client.getQueue() : [])
  }

  const session: AiChatSession = {
    loaded,
    conversations: () =>
      [...store()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(conversationMeta),
    activeId,
    messages,
    isLoading,
    queuedCount,
    queuedMessages,
    error,
    historyTrimmed,

    send(text) {
      setError(undefined)
      const conversation = activeConversation()
      if (!conversation) {
        setError(new Error("请先新建或选择一个对话"))
        return Promise.resolve()
      }
      const client = ensureClient(conversation)
      if (!client) {
        setError(new Error("当前宿主未提供 AI 对话连接"))
        return Promise.resolve()
      }
      const trimmed = trimHistory(client.getMessages())
      if (trimmed) client.setMessagesManually(trimmed)
      setHistoryTrimmed(Boolean(trimmed))
      return client.sendMessage(
        text,
        buildSendOptions(conversation, attachmentIds(client.getMessages(), text)),
      )
    },

    sendImmediately(content) {
      setError(undefined)
      const conversation = activeConversation()
      if (!conversation) {
        setError(new Error("请先新建或选择一个对话"))
        return Promise.resolve()
      }
      const client = ensureClient(conversation)
      if (!client) {
        setError(new Error("当前宿主未提供 AI 对话连接"))
        return Promise.resolve()
      }
      const trimmed = trimHistory(client.getMessages())
      if (trimmed) client.setMessagesManually(trimmed)
      setHistoryTrimmed(Boolean(trimmed))
      return client.sendMessage(
        content,
        buildSendOptions(conversation, attachmentIds(client.getMessages(), content)),
        { whenBusy: "interrupt" },
      )
    },

    stop() {
      clients.get(activeId() ?? "")?.stop()
    },

    cancelQueued(id) {
      clients.get(activeId() ?? "")?.cancelQueued(id)
    },

    clear() {
      const id = activeId()
      if (!id) return
      clients.get(id)?.clear()
      setStore((list) =>
        list.map((conversation) =>
          conversation.id === id
            ? {
                ...conversation,
                messages: [],
                title: conversation.titleExplicit ? conversation.title : "新对话",
                titleModelTried: false,
                updatedAt: new Date().toISOString(),
              }
            : conversation,
        ),
      )
      setMessages([])
      setLoading(false)
      setQueuedCount(0)
      setQueuedMessages([])
      setError(undefined)
      setHistoryTrimmed(false)
      persistNow()
    },

    retry() {
      setError(undefined)
      const client = clients.get(activeId() ?? "")
      return client?.reload() ?? Promise.resolve()
    },

    startNewConversation() {
      clients.get(activeId() ?? "")?.stop()
      setActiveId(null)
      setMessages([])
      setLoading(false)
      setQueuedCount(0)
      setQueuedMessages([])
      setError(undefined)
      setHistoryTrimmed(false)
    },

    createConversation() {
      const id = newId()
      const now = new Date().toISOString()
      setStore((list) => [
        { id, title: "新对话", createdAt: now, updatedAt: now, messages: [] },
        ...list,
      ])
      persistNow()
      activate(id)
      return id
    },

    switchConversation(id) {
      if (id === activeId()) return
      activate(id)
    },

    renameConversation(id, title) {
      const normalized = title.trim()
      if (!normalized) return
      setStore((list) =>
        list.map((conversation) =>
          conversation.id === id
            ? {
                ...conversation,
                title: normalized.slice(0, MAX_TITLE_CHARS * 4),
                titleExplicit: true,
                updatedAt: new Date().toISOString(),
              }
            : conversation,
        ),
      )
      persistNow()
    },

    deleteConversation(id) {
      setStore((list) => list.filter((conversation) => conversation.id !== id))
      clients.get(id)?.dispose()
      clients.delete(id)
      persistNow()
      if (activeId() === id) {
        const remaining = store()
        const next = [...remaining].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
        if (next) {
          activate(next.id)
        } else {
          setActiveId(null)
          setMessages([])
          setLoading(false)
          setQueuedCount(0)
          setQueuedMessages([])
          setError(undefined)
        }
      }
    },

    updateConversationOptions(id, conversationOptions) {
      setStore((list) =>
        list.map((conversation) => {
          if (conversation.id !== id) return conversation
          const next: AiChatStoredConversation = {
            ...conversation,
            updatedAt: new Date().toISOString(),
          }
          if ("systemPrompt" in conversationOptions) {
            const prompt = conversationOptions.systemPrompt?.trim() ?? ""
            if (prompt) next.systemPrompt = prompt
            else delete next.systemPrompt
          }
          if ("temperature" in conversationOptions) {
            if (conversationOptions.temperature === undefined) delete next.temperature
            else next.temperature = conversationOptions.temperature
          }
          if ("modelId" in conversationOptions) {
            const modelId = conversationOptions.modelId?.trim() ?? ""
            if (modelId) next.modelId = modelId
            else delete next.modelId
          }
          if ("reasoningEffort" in conversationOptions) {
            if (conversationOptions.reasoningEffort === undefined) delete next.reasoningEffort
            else next.reasoningEffort = conversationOptions.reasoningEffort
          }
          if ("maxOutputTokens" in conversationOptions) {
            if (conversationOptions.maxOutputTokens === undefined) delete next.maxOutputTokens
            else next.maxOutputTokens = conversationOptions.maxOutputTokens
          }
          if ("contextBlocks" in conversationOptions) {
            const blocks = conversationOptions.contextBlocks ?? []
            if (blocks.length > 0) next.contextBlocks = blocks
            else delete next.contextBlocks
          }
          return next
        }),
      )
      persistNow()
    },

    async editLastUserMessage(text) {
      const conversation = activeConversation()
      const client = clients.get(activeId() ?? "")
      if (!conversation || !client || session.isLoading()) return
      const history = client.getMessages()
      let lastUserIndex = -1
      for (let index = history.length - 1; index >= 0; index -= 1) {
        if (history[index]?.role === "user") {
          lastUserIndex = index
          break
        }
      }
      if (lastUserIndex < 0) return
      const edited = history
        .slice(0, lastUserIndex + 1)
        .map((message, index) =>
          index === lastUserIndex
            ? { ...message, parts: [{ type: "text" as const, content: text }] }
            : message,
        )
      client.setMessagesManually(edited)
      setError(undefined)
      await client.reload()
    },
  }

  sessions.set(options.instanceId, session)

  void options.data
    .get<AiChatStoredConversation[]>(STORAGE_KEY)
    .then((stored) => {
      const valid = Array.isArray(stored) ? stored : []
      setStore(valid)
      const mostRecent = [...valid].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0]
      if (mostRecent) activate(mostRecent.id)
      setLoaded(true)
    })
    .catch(() => {
      setLoaded(true)
    })

  return session
}

/** Restore helper shared by views: reads persisted conversations for an instance. */
export function aiChatStorageKey(): string {
  return STORAGE_KEY
}

const ERROR_COPY: Record<string, { title: string; hint: string }> = {
  ai_not_configured: {
    title: "AI 还未配置",
    hint: "在设置中心 AI 面板配置模型后即可对话。",
  },
  ai_auth_required: {
    title: "登录后可使用内置模型",
    hint: "登录 Tabora 账号，或改用自定义提供商。",
  },
  ai_model_unavailable: {
    title: "模型暂不可用",
    hint: "请检查 AI 设置中的模型配置。",
  },
  ai_request_rejected: {
    title: "请求被拒绝",
    hint: "输入或对话历史超出限制，请缩短内容后重试。",
  },
  ai_provider_failed: {
    title: "请求失败",
    hint: "AI 服务暂时不可用，请稍后重试。",
  },
}

export function aiChatErrorCopy(error: Error | undefined): {
  title: string
  hint: string
  openSettings: boolean
} {
  const code = (error as { code?: string } | undefined)?.code
  const entry = code ? ERROR_COPY[code] : undefined
  if (entry) {
    return {
      title: entry.title,
      hint: entry.hint,
      openSettings: code !== "ai_provider_failed" && code !== "ai_request_rejected",
    }
  }
  return { title: "请求失败", hint: error?.message ?? "请稍后重试。", openSettings: false }
}
