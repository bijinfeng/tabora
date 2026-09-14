import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { strToU8, zipSync } from "fflate"
import { makeWidgetViewProps } from "../../../test-support/widgetViewProps"
import type { AiChatConnection, WidgetViewData, WidgetViewProps } from "@tabora/plugin-api/sdk"
import { AiChatCard } from "../card/ai-chat-card"
import { AiChatExpand } from "../layout/ai-chat-expand"
import { AiChatUserMessage } from "../message/ai-chat-user-message"
import { AI_CHAT_ATTACHMENT_METADATA, buildAttachmentContent } from "../ai-chat-attachments"
import { getAiChatSession, setAiChatRuntime } from "../conversation/ai-chat-session"
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
async function waitForLoaded(session: { loaded(): boolean }) {
  await vi.waitFor(() => expect(session.loaded()).toBe(true))
}

async function waitForPersistedSave() {
  await new Promise((resolve) => setTimeout(resolve, 320))
}
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
                    { id: "model-b", label: "模型 B", reasoning: { effort: true } },
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
