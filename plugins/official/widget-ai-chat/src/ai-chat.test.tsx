import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { strToU8, zipSync } from "fflate"
import { makeWidgetViewProps } from "../../test-support/widgetViewProps"
import type {
  AiChatConnection,
  PluginManifest,
  WidgetViewData,
  WidgetViewProps,
} from "@tabora/plugin-api/sdk"
import { AiRuntimeError } from "@tabora/plugin-api/sdk"
import type { UIMessage } from "@tanstack/ai-client"
import { officialPluginAiChatManifest } from "./manifest"
import { officialPluginAiChat } from "./index"
import { AiChatCard } from "./ai-chat-card"
import { AiChatExpand } from "./ai-chat-expand"
import { AiChatUserMessage } from "./ai-chat-user-message"
import { AI_CHAT_ATTACHMENT_METADATA, buildAttachmentContent } from "./ai-chat-attachments"
import {
  aiChatErrorCopy,
  getAiChatSession,
  messageText,
  registerAiChatView,
  runNewConversationCommand,
  setAiChatRuntime,
  trimHistory,
} from "./ai-chat-session"
import type { AiChatStoredConversation } from "./ai-chat-session"

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

function makeProps(overrides: Partial<WidgetViewProps> = {}): WidgetViewProps {
  return makeWidgetViewProps({
    instanceId: "ai-chat-1",
    pluginId: "official.widgets.ai-chat",
    contributionId: "ai-chat",
    size: "M",
    ...overrides,
  })
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

function userMessage(id: string, content: string): UIMessage {
  return { id, role: "user", parts: [{ type: "text", content }] }
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
    expect(session.historyTrimmed()).toBe(false)
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

  it("trims long histories before they exceed the gateway caps", () => {
    const short = [userMessage("m1", "hi"), userMessage("m2", "there")]
    expect(trimHistory(short)).toBeUndefined()

    const long = Array.from({ length: 105 }, (_, index) => userMessage(`m${index}`, "hi"))
    const trimmed = trimHistory(long)
    expect(trimmed).toHaveLength(99)
    expect(trimmed?.at(-1)?.id).toBe("m104")

    const oversized = [
      userMessage("m1", "x".repeat(40_000)),
      userMessage("m2", "x".repeat(40_000)),
      userMessage("m3", "x".repeat(40_000)),
    ]
    const charTrimmed = trimHistory(oversized)
    expect(charTrimmed?.map((message) => message.id)).toEqual(["m2", "m3"])

    const headroom = Array.from({ length: 4 }, (_, index) =>
      userMessage(`h${index}`, "x".repeat(30_000)),
    )
    expect(trimHistory(headroom)?.map((message) => message.id)).toEqual(["h2", "h3"])
  })
})

describe("AiChatCard", () => {
  it("renders a non-interactive brand mark on content sizes", () => {
    setAiChatRuntime(undefined)
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <AiChatCard {...makeProps()} />, root)
    expect(root.textContent).toContain("AI 对话")
    expect(root.textContent).toContain("Tabora / AI")
    expect(root.textContent).not.toContain("AI CHAT")
    expect(root.textContent).not.toContain("READY")
    expect(root.textContent).not.toContain("发送")
    expect(root.querySelector("textarea")).toBeNull()
    root.remove()
  })

  it("renders the same brand mark at the compact S size", () => {
    setAiChatRuntime(undefined)
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <AiChatCard {...makeProps({ size: "S" })} />, root)
    expect(root.textContent).toContain("AI 对话")
    expect(root.textContent).toContain("Tabora / AI")
    expect(root.querySelector("textarea")).toBeNull()
    root.remove()
  })
})

describe("AiChatExpand composer controls", () => {
  it("shows attached inline images again in persisted user messages", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <AiChatUserMessage
          message={{
            id: "image-message",
            role: "user",
            parts: [
              { type: "text", content: "请描述图片" },
              {
                type: "image",
                source: { type: "data", mimeType: "image/png", value: "iVBORw==" },
              },
            ],
          }}
        />
      ),
      root,
    )

    expect(root.textContent).toContain("请描述图片")
    expect(root.querySelector("img")?.getAttribute("src")).toBe("data:image/png;base64,iVBORw==")
    root.remove()
  })

  it("renders sent files as separate expandable attachments instead of prompt text", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <AiChatUserMessage
          message={{
            id: "text-attachment-message",
            role: "user",
            parts: [
              {
                type: "text",
                content:
                  '检查附件\n\n<attachment filename="说明.md">\n不应直接显示的文件内容\n</attachment>',
              },
            ],
            metadata: {
              [AI_CHAT_ATTACHMENT_METADATA]: {
                displayText: "检查附件",
                attachments: [
                  {
                    name: "说明.md",
                    size: 12,
                    mimeType: "text/markdown",
                    kind: "text",
                    status: "provided",
                    detail: "已提供给模型",
                    preview: "不应直接显示的文件内容",
                  },
                ],
              },
            },
          }}
        />
      ),
      root,
    )

    expect(root.textContent).toContain("检查附件")
    expect(root.textContent).not.toContain('<attachment filename="说明.md">')
    const attachment = root.querySelector('button[aria-expanded="false"]') as HTMLButtonElement
    attachment.click()
    expect(root.textContent).toContain("不应直接显示的文件内容")
    root.remove()
  })

  it("does not offer text-only edit for a user message that includes an image", async () => {
    setAiChatRuntime({
      generate: async () => ({ text: "" }),
      stream: async function* () {},
      createChatConnection: () => echoConnection(),
    })
    const { data } = makeDataStore()
    const session = getAiChatSession({ instanceId: "expand-image-edit", data })
    await waitForLoaded(session)
    session.createConversation()
    await session.send({
      content: [
        { type: "text", content: "请描述图片" },
        { type: "image", source: { type: "data", mimeType: "image/png", value: "iVBORw==" } },
      ],
    })

    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <AiChatExpand
          {...makeWidgetViewProps({
            instanceId: "expand-image-edit",
            pluginId: "official.widgets.ai-chat",
            contributionId: "ai-chat",
            size: "L",
            data,
          })}
        />
      ),
      root,
    )

    expect(root.querySelector('[aria-label="编辑这条提问并重新生成"]')).toBeNull()
    root.remove()
  })

  it("keeps text attachments out of the prompt and marks them for agent tools", async () => {
    const text = new File(["# 项目说明\n你好"], "说明.md", { type: "text/markdown" })
    const content = (await buildAttachmentContent("这里面都有什么问题", [text], undefined, [
      { id: "102", filename: "说明.md", mimeType: "text/markdown", size: text.size },
    ])) as {
      content: Array<{ type: string; content?: string }>
      metadata: Record<string, unknown>
    }

    expect(content.content[0]?.content).toBe("这里面都有什么问题")
    expect(content.metadata[AI_CHAT_ATTACHMENT_METADATA]).toMatchObject({
      displayText: "这里面都有什么问题",
      attachments: [{ name: "说明.md", status: "provided", resourceId: "102" }],
    })
  })

  it("keeps ZIP contents private until the agent asks its host tools", async () => {
    const archive = new File(
      [
        zipSync({
          "src/hello.ts": strToU8("export const hello = 'world'"),
          "audio.mp3": new Uint8Array([1, 2]),
        }),
      ],
      "项目.zip",
      { type: "application/zip" },
    )
    const content = (await buildAttachmentContent("检查代码", [archive], undefined, [
      { id: "103", filename: "项目.zip", mimeType: "application/zip", size: archive.size },
    ])) as {
      content: Array<{ type: string; content?: string }>
      metadata: Record<string, unknown>
    }

    expect(content.content[0]?.content).toBe("检查代码")
    expect(content.metadata[AI_CHAT_ATTACHMENT_METADATA]).toMatchObject({
      attachments: [{ name: "项目.zip", kind: "archive", status: "provided", resourceId: "103" }],
    })
  })

  it("converts bounded image attachments to TanStack multimodal parts", async () => {
    const image = new File([new Uint8Array([137, 80, 78, 71])], "截图.png", {
      type: "image/png",
    })

    const content = await buildAttachmentContent("请描述图片", [image])
    expect(content).toMatchObject({
      content: [
        { type: "text", content: "请描述图片" },
        { type: "image", source: { type: "data", mimeType: "image/png" } },
      ],
      metadata: {
        [AI_CHAT_ATTACHMENT_METADATA]: {
          displayText: "请描述图片",
          attachments: [{ name: "截图.png", status: "provided" }],
        },
      },
    })
    expect(
      (content as { content: Array<{ type: string; source?: { value?: string } }> }).content[1]
        ?.source?.value,
    ).toBe("iVBORw==")
  })

  it("starts a blank composer from the advertised Ctrl+N shortcut", async () => {
    setAiChatRuntime({
      generate: async () => ({ text: "" }),
      stream: async function* () {},
      createChatConnection: () => echoConnection(),
    })
    const { data } = makeDataStore()
    const session = getAiChatSession({ instanceId: "expand-shortcut", data })
    await waitForLoaded(session)
    session.createConversation()

    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <AiChatExpand
          {...makeWidgetViewProps({
            instanceId: "expand-shortcut",
            pluginId: "official.widgets.ai-chat",
            contributionId: "ai-chat",
            size: "L",
            data,
          })}
        />
      ),
      root,
    )

    const composer = root.querySelector("textarea")
    composer?.dispatchEvent(
      new KeyboardEvent("keydown", { key: "n", ctrlKey: true, bubbles: true }),
    )
    await vi.waitFor(() => expect(session.activeId()).toBeNull())
    expect(root.textContent).toContain("接下来，交给我吧")
    root.remove()
  })

  it("returns to the blank composer without saving an empty conversation", async () => {
    setAiChatRuntime({
      generate: async () => ({ text: "" }),
      stream: async function* () {},
      createChatConnection: () => echoConnection(),
    })
    const { data } = makeDataStore()
    const session = getAiChatSession({ instanceId: "expand-new-chat", data })
    await waitForLoaded(session)
    session.createConversation()

    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <AiChatExpand
          {...makeWidgetViewProps({
            instanceId: "expand-new-chat",
            pluginId: "official.widgets.ai-chat",
            contributionId: "ai-chat",
            size: "L",
            data,
          })}
        />
      ),
      root,
    )

    const newChat = Array.from(root.querySelectorAll("button")).find((button) =>
      button.textContent?.includes("新对话"),
    )
    expect(newChat).toBeDefined()
    const attachmentInput = root.querySelector('input[type="file"]') as HTMLInputElement
    Object.defineProperty(attachmentInput, "files", {
      configurable: true,
      value: [new File(["附件内容"], "待发送.txt", { type: "text/plain" })],
    })
    attachmentInput.dispatchEvent(new Event("change", { bubbles: true }))
    await vi.waitFor(() => expect(root.textContent).toContain("待发送.txt"))
    newChat?.click()

    await vi.waitFor(() => expect(root.textContent).toContain("接下来，交给我吧"))
    expect(root.textContent).not.toContain("待发送.txt")
    expect(session.activeId()).toBeNull()
    expect(session.conversations()).toHaveLength(1)
    await waitForPersistedSave()
    expect(await data.get<AiChatStoredConversation[]>("ai-chat-conversations")).toHaveLength(1)
    root.remove()
  })

  it("renders the run-option chips reflecting the active conversation", async () => {
    setAiChatRuntime({
      generate: async () => ({ text: "" }),
      stream: async function* () {},
      createChatConnection: () => echoConnection(),
    })
    const { data } = makeDataStore()
    const session = getAiChatSession({ instanceId: "expand-chips", data })
    await waitForLoaded(session)
    session.createConversation()
    session.updateConversationOptions(session.activeId()!, {
      modelId: "model-b",
      reasoningEffort: "high",
      maxOutputTokens: 2048,
      contextBlocks: [{ id: "c1", label: "写作规范", text: "使用简体中文" }],
    })

    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <AiChatExpand
          {...makeWidgetViewProps({
            instanceId: "expand-chips",
            pluginId: "official.widgets.ai-chat",
            contributionId: "ai-chat",
            size: "L",
            data,
            host: {
              getAiSettings: async () => ({
                activeProvider: "builtin",
                builtin: {
                  status: "available",
                  modelId: "model-a",
                  models: [
                    { id: "model-a", label: "模型 A" },
                    { id: "model-b", label: "模型 B" },
                  ],
                },
                custom: { baseUrl: "", model: "", apiKeyConfigured: false },
              }),
            },
          })}
        />
      ),
      root,
    )

    await vi.waitFor(() => expect(root.textContent).toContain("模型 B"))
    expect(root.textContent).toContain("深度")
    expect(root.textContent).toContain("添加附件")
    const attachmentInput = root.querySelector('input[type="file"]') as HTMLInputElement
    expect(attachmentInput).not.toBeNull()
    const sendButton = root.querySelector('button[aria-label="发送"]') as HTMLButtonElement
    expect(sendButton.disabled).toBe(true)
    Object.defineProperty(attachmentInput, "files", {
      configurable: true,
      value: [new File(["附件内容"], "说明.txt", { type: "text/plain" })],
    })
    attachmentInput.dispatchEvent(new Event("change", { bubbles: true }))
    await vi.waitFor(() => expect(sendButton.disabled).toBe(false))
    root.remove()
  })
})
