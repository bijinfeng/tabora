import { describe, expect, it, vi } from "vitest"
import type { AiChatConnection, PluginManifest, WidgetViewData } from "@tabora/plugin-api/sdk"
import { AiRuntimeError } from "@tabora/plugin-api/sdk"
import { officialPluginAiChatManifest } from "./manifest"
import { officialPluginAiChat } from "./index"
import { buildAttachmentContent } from "./ai-chat-attachments"
import {
  aiChatErrorCopy,
  getAiChatSession,
  messageText,
  registerAiChatView,
  runNewConversationCommand,
  setAiChatRuntime,
} from "./conversation/ai-chat-session"
import type { AiChatStoredConversation } from "./conversation/ai-chat-session"

function makeDataStore() {
  const map = new Map<string, unknown>()
  const data: WidgetViewData = {
    get: async <T,>(key: string) => map.get(key) as T | undefined,
    save: async <T,>(key: string, value: T) => {
      map.set(key, value)
    },
  }
  return { data, map }
}

type WireMessage = { id: string; role: string; parts: Array<{ type: string; content: string }> }

/** Fake AG-UI connection: echoes the last user message as an assistant reply. */
function echoConnection(): AiChatConnection {
  return {
    async *connect(messages) {
      const list = messages as WireMessage[]
      const last = [...list].reverse().find((message) => message.role === "user")
      const text = (last?.parts ?? [])
        .filter((part) => part.type === "text")
        .map((part) => part.content)
        .join("")
      yield { type: "RUN_STARTED", threadId: "t", runId: "r" }
      yield { type: "TEXT_MESSAGE_START", messageId: "a1", role: "assistant" }
      yield { type: "TEXT_MESSAGE_CONTENT", messageId: "a1", delta: `echo:${text}` }
      yield { type: "TEXT_MESSAGE_END", messageId: "a1" }
      yield { type: "RUN_FINISHED", threadId: "t", runId: "r" }
    },
  }
}

function gatedConnection(gate: Promise<void>): AiChatConnection {
  let generation = 0
  return {
    async *connect(messages) {
      const current = ++generation
      const list = messages as WireMessage[]
      const last = [...list].reverse().find((message) => message.role === "user")
      const text = (last?.parts ?? [])
        .filter((part) => part.type === "text")
        .map((part) => part.content)
        .join("")
      yield { type: "RUN_STARTED", threadId: "t", runId: `r-${current}` }
      if (current === 1) await gate
      yield { type: "TEXT_MESSAGE_START", messageId: `a-${current}`, role: "assistant" }
      yield { type: "TEXT_MESSAGE_CONTENT", messageId: `a-${current}`, delta: `echo:${text}` }
      yield { type: "TEXT_MESSAGE_END", messageId: `a-${current}` }
      yield { type: "RUN_FINISHED", threadId: "t", runId: `r-${current}` }
    },
  }
}

async function waitForLoaded(session: { loaded(): boolean }) {
  await vi.waitFor(() => expect(session.loaded()).toBe(true))
}

async function waitForPersistedSave() {
  await new Promise((resolve) => setTimeout(resolve, 320))
}

describe("officialPluginAiChatManifest", () => {
  it("declares the AI generation and tool permissions with matching views", () => {
    const manifest: PluginManifest = officialPluginAiChatManifest
    expect(manifest.id).toBe("official.widgets.ai-chat")
    expect(manifest.permissions).toEqual([{ type: "ai", access: ["generate", "tools"] }])
    expect(manifest.contributes.widgets?.[0]?.supportedSizes).toEqual(["S", "M"])
    expect(manifest.contributes.widgets?.[0]?.defaultSize).toBe("M")
    expect(manifest.contributes.widgets?.[0]?.views).toEqual({
      card: "official.widgets.ai-chat.card",
      expand: "official.widgets.ai-chat.expand",
    })
    expect(officialPluginAiChat.manifest.id).toBe(manifest.id)
  })
})

describe("getAiChatSession", () => {
  it("streams the active conversation through the host chat connection", async () => {
    const { data, map } = makeDataStore()
    setAiChatRuntime({
      generate: async () => ({ text: "" }),
      stream: async function* () {},
      createChatConnection: () => echoConnection(),
    })

    const session = getAiChatSession({ instanceId: "session-stream", data })
    await waitForLoaded(session)
    expect(session.conversations()).toEqual([])

    session.createConversation()
    await session.send("你好")

    const messages = session.messages()
    expect(messages).toHaveLength(2)
    expect(messages[0]?.role).toBe("user")
    expect(messageText(messages[1]!)).toBe("echo:你好")
    expect(session.error()).toBeUndefined()

    await waitForPersistedSave()
    const stored = map.get("ai-chat-conversations") as AiChatStoredConversation[]
    expect(stored).toHaveLength(1)
    expect(stored[0]?.messages).toHaveLength(2)
    expect(stored[0]?.title).toBe("你好")
  })

  it("persists attachment presentation metadata with the model context", async () => {
    const { data, map } = makeDataStore()
    setAiChatRuntime({
      generate: async () => ({ text: "" }),
      stream: async function* () {},
      createChatConnection: () => echoConnection(),
    })
    const session = getAiChatSession({ instanceId: "session-attachment-metadata", data })
    await waitForLoaded(session)
    session.createConversation()
    const attachment = new File(["# 可读内容"], "说明.md", { type: "text/markdown" })
    await session.send(
      await buildAttachmentContent("检查附件", [attachment], undefined, [
        { id: "101", filename: "说明.md", mimeType: "text/markdown", size: attachment.size },
      ]),
    )

    await waitForPersistedSave()
    const stored = map.get("ai-chat-conversations") as AiChatStoredConversation[]
    expect(stored[0]?.messages[0]?.attachmentMetadata).toMatchObject({
      displayText: "检查附件",
      attachments: [{ name: "说明.md", status: "provided" }],
    })
    expect(stored[0]?.messages[0]?.parts[0]).toMatchObject({ text: "检查附件" })
  })

  it("queues a follow-up while TanStack AI is streaming and drains it afterward", async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const { data } = makeDataStore()
    setAiChatRuntime({
      generate: async () => ({ text: "" }),
      stream: async function* () {},
      createChatConnection: () => gatedConnection(gate),
    })

    const session = getAiChatSession({ instanceId: "session-queue", data })
    await waitForLoaded(session)
    session.createConversation()
    const first = session.send("第一条")
    await vi.waitFor(() => expect(session.isLoading()).toBe(true))
    await session.send("第二条")
    await vi.waitFor(() => expect(session.queuedCount()).toBe(1))

    release()
    await first
    await vi.waitFor(() => expect(session.queuedCount()).toBe(0))
    await vi.waitFor(() =>
      expect(session.messages().map(messageText)).toEqual([
        "第一条",
        "echo:第一条",
        "第二条",
        "echo:第二条",
      ]),
    )
  })

  it("cancels an individual queued message before TanStack AI dispatches it", async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const { data } = makeDataStore()
    setAiChatRuntime({
      generate: async () => ({ text: "" }),
      stream: async function* () {},
      createChatConnection: () => gatedConnection(gate),
    })

    const session = getAiChatSession({ instanceId: "session-cancel-queued", data })
    await waitForLoaded(session)
    session.createConversation()
    const first = session.send("第一条")
    await vi.waitFor(() => expect(session.isLoading()).toBe(true))
    await session.send("取消这一条")
    await vi.waitFor(() => expect(session.queuedMessages()).toHaveLength(1))

    session.cancelQueued(session.queuedMessages()[0]!.id)
    expect(session.queuedCount()).toBe(0)
    expect(session.queuedMessages()).toEqual([])

    release()
    await first
    await vi.waitFor(() =>
      expect(session.messages().map(messageText)).toEqual(["第一条", "echo:第一条"]),
    )
  })

  it("interrupts generation instead of queueing when an immediate turn is requested", async () => {
    let release!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const { data } = makeDataStore()
    setAiChatRuntime({
      generate: async () => ({ text: "" }),
      stream: async function* () {},
      createChatConnection: () => gatedConnection(gate),
    })

    const session = getAiChatSession({ instanceId: "session-immediate", data })
    await waitForLoaded(session)
    session.createConversation()
    const first = session.send("旧问题")
    await vi.waitFor(() => expect(session.isLoading()).toBe(true))
    const immediate = session.sendImmediately("新问题")
    release()
    await Promise.all([first, immediate])

    await vi.waitFor(() =>
      expect(session.messages().at(-1)).toSatisfy((message) =>
        messageText(message!).includes("echo:新问题"),
      ),
    )
    expect(session.queuedMessages()).toEqual([])
  })

  it("manages multiple conversations with rename and delete", async () => {
    const { data, map } = makeDataStore()
    setAiChatRuntime({
      generate: async () => ({ text: "" }),
      stream: async function* () {},
      createChatConnection: () => echoConnection(),
    })

    const session = getAiChatSession({ instanceId: "session-manage", data })
    await waitForLoaded(session)

    const first = session.createConversation()
    const second = session.createConversation()
    expect(session.activeId()).toBe(second)

    session.switchConversation(first)
    expect(session.activeId()).toBe(first)

    session.renameConversation(first, "周报草稿")
    expect(session.conversations().find((conversation) => conversation.id === first)?.title).toBe(
      "周报草稿",
    )

    session.deleteConversation(first)
    expect(session.conversations().map((conversation) => conversation.id)).toEqual([second])
    expect(session.activeId()).toBe(second)

    session.deleteConversation(second)
    expect(session.conversations()).toEqual([])
    expect(session.activeId()).toBeNull()

    await waitForPersistedSave()
    expect(map.get("ai-chat-conversations")).toEqual([])
  })

  it("clears messages while keeping the conversation and its options", async () => {
    const { data } = makeDataStore()
    setAiChatRuntime({
      generate: async () => ({ text: "" }),
      stream: async function* () {},
      createChatConnection: () => echoConnection(),
    })

    const session = getAiChatSession({ instanceId: "session-clear-messages", data })
    await waitForLoaded(session)
    const id = session.createConversation()
    session.updateConversationOptions(id, { modelId: "model-a", temperature: 0.4 })
    await session.send("需要清空的问题")

    session.clear()

    expect(session.activeId()).toBe(id)
    expect(session.messages()).toEqual([])
    expect(session.conversations()).toMatchObject([
      { id, title: "新对话", messageCount: 0, modelId: "model-a", temperature: 0.4 },
    ])
  })

  it("keeps auto titles off manually renamed conversations", async () => {
    const { data } = makeDataStore()
    setAiChatRuntime({
      generate: async () => ({ text: "" }),
      stream: async function* () {},
      createChatConnection: () => echoConnection(),
    })

    const session = getAiChatSession({ instanceId: "session-title", data })
    await waitForLoaded(session)

    session.createConversation()
    session.renameConversation(session.activeId()!, "手工命名")
    await session.send("一个很长的提问会被自动用作标题吗")

    const title = session.conversations()[0]?.title
    expect(title).toBe("手工命名")
  })

  it("restores persisted conversations and activates the most recent one", async () => {
    const { data, map } = makeDataStore()
    const now = new Date().toISOString()
    map.set("ai-chat-conversations", [
      {
        id: "conv-old",
        title: "旧会话",
        createdAt: now,
        updatedAt: "2026-08-28T08:00:00.000Z",
        messages: [
          {
            id: "m1",
            role: "user",
            createdAt: now,
            status: "complete",
            parts: [{ type: "text", text: "之前的问题" }],
          },
          {
            id: "m2",
            role: "assistant",
            createdAt: now,
            status: "complete",
            parts: [{ type: "text", text: "之前的回答" }],
          },
        ],
      },
      {
        id: "conv-new",
        title: "最近会话",
        createdAt: now,
        updatedAt: "2026-08-28T09:00:00.000Z",
        messages: [],
      },
    ] satisfies AiChatStoredConversation[])

    setAiChatRuntime({
      generate: async () => ({ text: "" }),
      stream: async function* () {},
      createChatConnection: () => echoConnection(),
    })

    const session = getAiChatSession({ instanceId: "session-restore", data })
    await waitForLoaded(session)

    expect(session.activeId()).toBe("conv-new")
    expect(session.conversations().map((conversation) => conversation.id)).toEqual([
      "conv-new",
      "conv-old",
    ])

    session.switchConversation("conv-old")
    expect(session.messages().map(messageText)).toEqual(["之前的问题", "之前的回答"])
  })

  it("reports a degraded error when the host provides no chat connection", async () => {
    const { data } = makeDataStore()
    setAiChatRuntime(undefined)

    const session = getAiChatSession({ instanceId: "session-unavailable", data })
    await waitForLoaded(session)
    session.createConversation()
    await session.send("你好")
    expect(session.error()).toBeInstanceOf(Error)
    expect(aiChatErrorCopy(session.error()).title).toBe("请求失败")
  })

  it("unwraps normalized gateway errors from stream transport wrappers", async () => {
    setAiChatRuntime({
      generate: async () => ({ text: "" }),
      stream: async function* () {},
      createChatConnection: () => ({
        async *connect() {
          yield { type: "RUN_STARTED", threadId: "t", runId: "r" }
          throw Object.assign(new Error("Stream response body read failed"), {
            cause: new AiRuntimeError("ai_not_configured", "no model"),
          })
        },
      }),
    })

    const session = getAiChatSession({
      instanceId: "session-unwrap",
      data: makeDataStore().data,
    })
    await waitForLoaded(session)
    session.createConversation()
    await session.send("你好")
    expect(aiChatErrorCopy(session.error())).toMatchObject({
      title: "AI 还未配置",
      openSettings: true,
    })
  })

  it("maps normalized gateway error codes to user-facing copy", () => {
    const notConfigured = Object.assign(new Error("no model"), { code: "ai_not_configured" })
    expect(aiChatErrorCopy(notConfigured)).toMatchObject({
      title: "AI 还未配置",
      openSettings: true,
    })

    const providerFailed = Object.assign(new Error("boom"), { code: "ai_provider_failed" })
    expect(aiChatErrorCopy(providerFailed)).toMatchObject({
      title: "请求失败",
      openSettings: false,
    })

    expect(aiChatErrorCopy(new Error("plain"))).toMatchObject({
      title: "请求失败",
      openSettings: false,
    })
  })

  it("sends per-conversation run options and composed context", async () => {
    const bodies: Array<Record<string, unknown>> = []
    setAiChatRuntime({
      generate: async () => ({ text: "" }),
      stream: async function* () {},
      createChatConnection: () => ({
        async *connect(messages, data) {
          bodies.push({ ...(data as Record<string, unknown>) })
          const list = messages as WireMessage[]
          const last = [...list].reverse().find((message) => message.role === "user")
          const text = (last?.parts ?? [])
            .filter((part) => part.type === "text")
            .map((part) => part.content)
            .join("")
          yield { type: "RUN_STARTED", threadId: "t", runId: "r" }
          yield { type: "TEXT_MESSAGE_CONTENT", messageId: "a1", delta: `echo:${text}` }
          yield { type: "RUN_FINISHED", threadId: "t", runId: "r" }
        },
      }),
    })

    const session = getAiChatSession({ instanceId: "session-options", data: makeDataStore().data })
    await waitForLoaded(session)
    session.createConversation()
    session.updateConversationOptions(session.activeId()!, {
      systemPrompt: "你是一名严谨的编辑",
      temperature: 0.3,
      modelId: "custom-model",
      reasoningEffort: "high",
      maxOutputTokens: 512,
      contextBlocks: [{ id: "c1", label: "写作规范", text: "使用简体中文" }],
    })
    await session.send("检查这段文字")

    expect(bodies[0]).toMatchObject({
      temperature: 0.3,
      modelId: "custom-model",
      reasoningEffort: "high",
      maxOutputTokens: 512,
    })
    expect(bodies[0]?.system).toContain("你是一名严谨的编辑")
    expect(bodies[0]?.system).toContain("写作规范")
    expect(bodies[0]?.system).toContain("使用简体中文")
  })

  it("clears a per-conversation option when set back to undefined", async () => {
    setAiChatRuntime({
      generate: async () => ({ text: "" }),
      stream: async function* () {},
      createChatConnection: () => echoConnection(),
    })

    const session = getAiChatSession({ instanceId: "session-clear", data: makeDataStore().data })
    await waitForLoaded(session)
    session.createConversation()
    const id = session.activeId()!
    session.updateConversationOptions(id, { reasoningEffort: "high", modelId: "custom-model" })
    session.updateConversationOptions(id, { reasoningEffort: undefined, modelId: "" })

    const conversation = session.conversations().find((entry) => entry.id === id)!
    expect(conversation.reasoningEffort).toBeUndefined()
    expect(conversation.modelId).toBeUndefined()
  })

  it("edits the last user message and regenerates from it", async () => {
    setAiChatRuntime({
      generate: async () => ({ text: "" }),
      stream: async function* () {},
      createChatConnection: () => echoConnection(),
    })

    const session = getAiChatSession({ instanceId: "session-edit", data: makeDataStore().data })
    await waitForLoaded(session)
    session.createConversation()
    await session.send("第一版提问")

    await session.editLastUserMessage("修改后的提问")
    const messages = session.messages()
    expect(messages).toHaveLength(2)
    expect(messageText(messages[0]!)).toBe("修改后的提问")
    expect(messageText(messages[1]!)).toBe("echo:修改后的提问")
  })

  it("generates a model title once after the first exchange", async () => {
    const generateCalls: string[] = []
    setAiChatRuntime({
      generate: async (request) => {
        generateCalls.push(request.prompt)
        return { text: "周报开场白" }
      },
      stream: async function* () {},
      createChatConnection: () => echoConnection(),
    })

    const { data, map } = makeDataStore()
    const session = getAiChatSession({ instanceId: "session-model-title", data })
    await waitForLoaded(session)
    session.createConversation()
    await session.send("帮我写一句周报开场")

    await vi.waitFor(() => expect(session.conversations()[0]?.title).toBe("周报开场白"))
    expect(generateCalls).toHaveLength(1)

    await waitForPersistedSave()
    const stored = map.get("ai-chat-conversations") as AiChatStoredConversation[]
    expect(stored[0]?.titleModelTried).toBe(true)
  })

  it("opens the blank composer without persisting a conversation from the palette command", async () => {
    setAiChatRuntime({
      generate: async () => ({ text: "" }),
      stream: async function* () {},
      createChatConnection: () => echoConnection(),
    })
    const { data } = makeDataStore()
    const session = getAiChatSession({ instanceId: "session-command", data })
    await waitForLoaded(session)

    const openExpand = vi.fn()
    const unregister = registerAiChatView({
      instanceId: "session-command",
      session,
      openExpand,
    })

    session.createConversation()
    const countBefore = session.conversations().length

    runNewConversationCommand("session-command")
    expect(session.activeId()).toBeNull()
    expect(session.messages()).toEqual([])
    expect(session.conversations()).toHaveLength(countBefore)
    expect(openExpand).toHaveBeenCalledOnce()

    runNewConversationCommand("session-command")
    expect(session.conversations()).toHaveLength(countBefore)

    unregister()
    expect(() => runNewConversationCommand("session-command")).toThrow("请先添加 AI 对话卡片")
  })
})
