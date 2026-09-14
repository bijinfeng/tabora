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
import { attachmentMetadata } from "../ai-chat-attachments"
export { aiChatErrorCopy } from "./ai-chat-error"
import {
  buildSendOptions,
  CHAT_SYSTEM_PROMPT,
  deriveConversationTitle,
  MAX_CONVERSATION_TITLE_CHARS,
  messageText,
  newConversationId,
  toStoredMessage,
  toUIMessage,
} from "./ai-chat-model"
import type {
  AiChatContextBlock,
  AiChatConversationMeta,
  AiChatConversationOptions,
  AiChatStoredConversation,
} from "./ai-chat-model"
export { buildSendOptions, estimateContextUsage, messageText } from "./ai-chat-model"
export type {
  AiChatContextBlock,
  AiChatContextUsage,
  AiChatConversationMeta,
  AiChatConversationOptions,
  AiChatReasoningEffort,
  AiChatStoredConversation,
  AiChatStoredMessage,
  AiChatStoredPart,
} from "./ai-chat-model"

const STORAGE_KEY = "ai-chat-conversations"
const SAVE_DEBOUNCE_MS = 250
const COMPACTION_KEEP_RECENT_MESSAGES = 4
const COMPACTION_CONTEXT_LABEL = "已压缩的对话上下文"
const COMPACTION_SYSTEM_PROMPT =
  "你负责压缩 AI 对话历史。保留用户目标、已确认的事实、关键决定、约束、未完成事项和必要的技术细节。不要虚构信息，不要提及压缩过程；用与原对话相同的语言，输出可直接作为后续对话上下文的简洁摘要。"

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

export type AiChatSession = {
  loaded: Accessor<boolean>
  conversations: Accessor<AiChatConversationMeta[]>
  activeId: Accessor<string | null>
  messages: Accessor<UIMessage[]>
  isLoading: Accessor<boolean>
  queuedCount: Accessor<number>
  queuedMessages: Accessor<QueuedMessage[]>
  error: Accessor<Error | undefined>
  isCompressing: Accessor<boolean>
  send(content: string | MultimodalContent): Promise<void>
  /** Interrupt the active generation and dispatch this turn without queueing it. */
  sendImmediately(content: string | MultimodalContent): Promise<void>
  stop(): void
  cancelQueued(id: string): void
  clear(): void
  /** Replace older turns with an AI-generated summary while retaining recent context. */
  compressContext(): Promise<void>
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

function renderHistoryForCompaction(messages: UIMessage[]): string {
  return messages
    .map((message) => {
      const text = messageText(message).trim()
      return `${message.role === "assistant" ? "助手" : "用户"}：${text || "（无文本内容）"}`
    })
    .join("\n\n")
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
  const [isCompressing, setCompressing] = createSignal(false)

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
    return deriveConversationTitle(firstText?.text ?? "")
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
      const title = deriveConversationTitle(result?.text ?? "")
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
    isCompressing,

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
      persistNow()
    },

    async compressContext() {
      const conversation = activeConversation()
      const history = messages()
      if (!conversation || history.length <= COMPACTION_KEEP_RECENT_MESSAGES) {
        setError(new Error("至少需要 5 条消息才能压缩上下文"))
        return
      }
      if (session.isLoading() || isCompressing()) return
      if (!aiRuntime) {
        setError(new Error("当前宿主未提供 AI 压缩能力"))
        return
      }

      const olderMessages = history.slice(0, -COMPACTION_KEEP_RECENT_MESSAGES)
      const recentMessages = history.slice(-COMPACTION_KEEP_RECENT_MESSAGES)
      const existingSummary = (conversation.contextBlocks ?? []).find(
        (block) => block.source === "compaction",
      )
      const retainedBlocks = (conversation.contextBlocks ?? []).filter(
        (block) => block.source !== "compaction",
      )
      const prompt = [
        existingSummary ? `此前摘要：\n${existingSummary.text.trim()}` : "",
        `需要压缩的较早对话：\n${renderHistoryForCompaction(olderMessages)}`,
      ]
        .filter(Boolean)
        .join("\n\n")

      setError(undefined)
      setCompressing(true)
      try {
        const result = await aiRuntime.generate({
          system: COMPACTION_SYSTEM_PROMPT,
          prompt,
          maxOutputTokens: 1_800,
        })
        const summary = result.text.trim()
        if (!summary) throw new Error("未能生成可用的上下文摘要")

        const nextMessages = recentMessages.map((message) => toStoredMessage(message))
        const compactedBlock: AiChatContextBlock = {
          id: existingSummary?.id ?? newConversationId(),
          label: COMPACTION_CONTEXT_LABEL,
          text: summary,
          source: "compaction",
        }
        clients.get(conversation.id)?.setMessagesManually(recentMessages)
        setStore((list) =>
          list.map((candidate) =>
            candidate.id === conversation.id
              ? {
                  ...candidate,
                  contextBlocks: [...retainedBlocks, compactedBlock],
                  messages: nextMessages,
                  updatedAt: new Date().toISOString(),
                }
              : candidate,
          ),
        )
        setMessages(recentMessages)
        persistNow()
      } catch (next) {
        setError(unwrapAiError(next instanceof Error ? next : new Error("压缩上下文失败")))
      } finally {
        setCompressing(false)
      }
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
    },

    createConversation() {
      const id = newConversationId()
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
                title: normalized.slice(0, MAX_CONVERSATION_TITLE_CHARS * 4),
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
