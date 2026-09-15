import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { AiChatConnection, WidgetViewData } from "@tabora/plugin-api/sdk"
import { makeWidgetViewProps } from "../../../test-support/widgetViewProps"
import { AiChatExpand } from "../layout/ai-chat-expand"
import { getAiChatSession, messageText, setAiChatRuntime } from "../conversation/ai-chat-session"
import type { AiChatStoredConversation } from "../conversation/ai-chat-session"

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

function echoConnection(): AiChatConnection {
  return {
    async *connect(messages) {
      const list = messages as Array<{
        role: string
        parts: Array<{ type: string; content: string }>
      }>
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

async function waitForLoaded(session: { loaded(): boolean }) {
  await vi.waitFor(() => expect(session.loaded()).toBe(true))
}

describe("AI chat composer tools", () => {
  it("compacts older messages into replaceable context and keeps recent turns", async () => {
    const { data, map } = makeDataStore()
    const id = "session-compaction-conversation"
    const createdAt = "2026-01-01T00:00:00.000Z"
    map.set("ai-chat-conversations", [
      {
        id,
        title: "上下文压缩",
        createdAt,
        updatedAt: createdAt,
        contextBlocks: [
          { id: "manual", label: "写作规范", text: "使用简体中文" },
          { id: "previous", label: "已压缩的对话上下文", text: "旧摘要", source: "compaction" },
        ],
        messages: [
          {
            id: "u1",
            role: "user",
            createdAt,
            status: "complete",
            parts: [{ type: "text", text: "第一条用户消息" }],
          },
          {
            id: "a1",
            role: "assistant",
            createdAt,
            status: "complete",
            parts: [{ type: "text", text: "第一条助手消息" }],
          },
          {
            id: "u2",
            role: "user",
            createdAt,
            status: "complete",
            parts: [{ type: "text", text: "第二条用户消息" }],
          },
          {
            id: "a2",
            role: "assistant",
            createdAt,
            status: "complete",
            parts: [{ type: "text", text: "第二条助手消息" }],
          },
          {
            id: "u3",
            role: "user",
            createdAt,
            status: "complete",
            parts: [{ type: "text", text: "第三条用户消息" }],
          },
          {
            id: "a3",
            role: "assistant",
            createdAt,
            status: "complete",
            parts: [{ type: "text", text: "第三条助手消息" }],
          },
        ],
      } satisfies AiChatStoredConversation,
    ])
    const generate = vi.fn(async () => ({ text: "已确认需求，并完成了第一轮讨论。" }))
    setAiChatRuntime({
      generate,
      stream: async function* () {},
      createChatConnection: () => echoConnection(),
    })

    const session = getAiChatSession({ instanceId: "session-compaction", data })
    await waitForLoaded(session)
    await session.compressContext()

    expect(session.messages().map(messageText)).toEqual([
      "第二条用户消息",
      "第二条助手消息",
      "第三条用户消息",
      "第三条助手消息",
    ])
    expect(generate).toHaveBeenCalledWith(
      expect.objectContaining({ prompt: expect.stringContaining("第一条用户消息") }),
    )
    const stored = map.get("ai-chat-conversations") as AiChatStoredConversation[]
    expect(stored[0]?.messages).toHaveLength(4)
    expect(stored[0]?.contextBlocks).toEqual([
      { id: "manual", label: "写作规范", text: "使用简体中文" },
      {
        id: "previous",
        label: "已压缩的对话上下文",
        text: "已确认需求，并完成了第一轮讨论。",
        source: "compaction",
      },
    ])
  })

  it("keeps the conversation unchanged when context compaction fails", async () => {
    const { data, map } = makeDataStore()
    const id = "session-compaction-error-conversation"
    const createdAt = "2026-01-01T00:00:00.000Z"
    map.set("ai-chat-conversations", [
      {
        id,
        title: "上下文压缩失败",
        createdAt,
        updatedAt: createdAt,
        messages: ["一", "二", "三", "四", "五"].map((text, index) => ({
          id: `message-${index}`,
          role: index % 2 === 0 ? "user" : "assistant",
          createdAt,
          status: "complete" as const,
          parts: [{ type: "text" as const, text }],
        })),
      } satisfies AiChatStoredConversation,
    ])
    setAiChatRuntime({
      generate: async () => {
        throw new Error("摘要服务不可用")
      },
      stream: async function* () {},
      createChatConnection: () => echoConnection(),
    })

    const session = getAiChatSession({ instanceId: "session-compaction-error", data })
    await waitForLoaded(session)
    await session.compressContext()

    expect(session.messages().map(messageText)).toEqual(["一", "二", "三", "四", "五"])
    expect(
      (map.get("ai-chat-conversations") as AiChatStoredConversation[])[0]?.messages,
    ).toHaveLength(5)
    expect(session.error()?.message).toBe("摘要服务不可用")
  })

  it("opens the chat tool menu from a slash and reuses the model choices", async () => {
    setAiChatRuntime({
      generate: async () => ({ text: "" }),
      stream: async function* () {},
      createChatConnection: () => echoConnection(),
    })
    const { data } = makeDataStore()
    const session = getAiChatSession({ instanceId: "expand-slash-tools", data })
    await waitForLoaded(session)
    session.createConversation()
    await session.send("需要保留的消息")

    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <AiChatExpand
          {...makeWidgetViewProps({
            instanceId: "expand-slash-tools",
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

    const textarea = root.querySelector("textarea") as HTMLTextAreaElement
    textarea.value = "/"
    textarea.dispatchEvent(new Event("input", { bubbles: true }))
    await vi.waitFor(() => expect(root.textContent).toContain("压缩上下文"))
    expect(root.textContent).toContain("新建对话")
    expect(root.textContent).toContain("切换模型")
    expect(root.textContent).toContain("清空当前对话")

    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }))
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }))
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    await vi.waitFor(() => expect(root.textContent).toContain("模型 B"))
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }))
    textarea.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    await vi.waitFor(() => expect(session.conversations()[0]?.modelId).toBe("model-b"))

    textarea.value = "/"
    textarea.dispatchEvent(new Event("input", { bubbles: true }))
    await vi.waitFor(() => expect(root.textContent).toContain("清空当前对话"))
    const clearAction = root.querySelector(
      'button[aria-label="执行工具 清空当前对话"]',
    ) as HTMLButtonElement
    clearAction.click()
    await vi.waitFor(() => expect(document.body.textContent).toContain("清空对话消息"))
    const cancel = Array.from(document.body.querySelectorAll("button")).find(
      (button) => button.textContent?.trim() === "取消",
    )
    cancel?.click()
    root.remove()
  })
})
