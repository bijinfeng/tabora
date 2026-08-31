import { ChatClient } from "@tanstack/ai-client"
import type { ConnectionAdapter, UIMessage } from "@tanstack/ai-client"
import { createSignal } from "solid-js"
import type { Accessor } from "solid-js"
import { AiRuntimeError } from "@tabora/plugin-api/sdk"
import type { AiRuntimeBridge, WidgetViewData } from "@tabora/plugin-api/sdk"

const CHAT_SYSTEM_PROMPT =
  "你是 Tabora 工作台中的 AI 助手。用与用户相同的语言回答，保持简洁直接，可用 Markdown 组织内容。"

/** Aligned with the gateway chat history caps; leave headroom for the new turn. */
const HISTORY_MAX_MESSAGES = 99
const HISTORY_MAX_CHARS = 92_000

const STORAGE_KEY = "ai-chat-conversations"
const MAX_TITLE_CHARS = 24
const SAVE_DEBOUNCE_MS = 250

let aiRuntime: AiRuntimeBridge | undefined
let openAiSettings: ((sectionId?: string) => void) | undefined

export function setAiChatRuntime(runtime: AiRuntimeBridge | undefined) {
  aiRuntime = runtime
}

export function setAiChatSettingsOpener(opener: ((sectionId?: string) => void) | undefined) {
  openAiSettings = opener
}

export function getAiChatSettingsOpener(): ((sectionId?: string) => void) | undefined {
  return openAiSettings
}

export type AiChatStoredMessage = {
  id: string
  role: "user" | "assistant"
  createdAt: string
  status: "complete" | "error"
  errorCode?: string
  parts: [{ type: "text"; text: string }]
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
  error: Accessor<Error | undefined>
  historyTrimmed: Accessor<boolean>
  send(text: string): Promise<void>
  stop(): void
  retry(): Promise<void>
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
  entry.session.createConversation()
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
  return {
    id: message.id,
    role: message.role === "assistant" ? "assistant" : "user",
    createdAt: message.createdAt?.toISOString() ?? new Date().toISOString(),
    status,
    parts: [{ type: "text", text: messageText(message) }],
  }
}

function toUIMessage(stored: AiChatStoredMessage): UIMessage {
  return {
    id: stored.id,
    role: stored.role,
    parts: stored.parts.map((part) => ({ type: "text", content: part.text })),
  }
}

export function trimHistory(history: UIMessage[]): UIMessage[] | undefined {
  if (history.length <= 2) return undefined
  let start = history.length > HISTORY_MAX_MESSAGES ? history.length - HISTORY_MAX_MESSAGES : 0
  let total = 0
  for (const message of history) total += messageText(message).length
  while (start < history.length - 2 && total > HISTORY_MAX_CHARS) {
    total -= messageText(history[start]!).length
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

export function buildSendOptions(conversation: AiChatStoredConversation): {
  system: string
  temperature?: number
  maxOutputTokens?: number
  modelId?: string
  reasoningEffort?: AiChatReasoningEffort
} {
  return {
    system: composeSystemPrompt(conversation),
    ...(conversation.temperature === undefined ? {} : { temperature: conversation.temperature }),
    ...(conversation.maxOutputTokens === undefined
      ? {}
      : { maxOutputTokens: conversation.maxOutputTokens }),
    ...(conversation.modelId ? { modelId: conversation.modelId } : {}),
    ...(conversation.reasoningEffort ? { reasoningEffort: conversation.reasoningEffort } : {}),
  }
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
    return firstUser ? deriveTitle(firstUser.parts[0]?.text ?? "") : conversation.title
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
    const userText = messageText(next.find((message) => message.role === "user")!)
    const assistantText = messageText(next.find((message) => message.role === "assistant")!)
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
  }

  const session: AiChatSession = {
    loaded,
    conversations: () =>
      [...store()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(conversationMeta),
    activeId,
    messages,
    isLoading,
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
      return client.sendMessage(text, buildSendOptions(conversation))
    },

    stop() {
      clients.get(activeId() ?? "")?.stop()
    },

    retry() {
      setError(undefined)
      const client = clients.get(activeId() ?? "")
      return client?.reload() ?? Promise.resolve()
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
