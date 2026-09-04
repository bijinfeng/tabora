import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type {
  AiChatClient,
  AiChatClientOptions,
  PluginContext,
  WidgetViewProps,
} from "@tabora/plugin-api/sdk"
import { makeWidgetViewProps } from "../../test-support/widgetViewProps"
import { officialPluginNotes } from "./index"
import { NotesCard } from "./notes-card"
import { NotesExpand } from "./notes-expand"
function makeProps(overrides: Partial<WidgetViewProps> = {}): WidgetViewProps {
  return makeWidgetViewProps({
    instanceId: "notes-1",
    pluginId: "official.widgets.notes",
    contributionId: "notes",
    size: "L",
    ...overrides,
  })
}

async function flushMount() {
  await Promise.resolve()
  await Promise.resolve()
}

describe("NotesCard", () => {
  it("renders the widget body", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesCard {...makeProps()} />, root)
    expect(root.textContent).toContain("My memo stream")
    root.remove()
  })

  it("renders the size-specific memo composition", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesCard {...makeProps()} size="M" />, root)
    expect(root.textContent).toContain("Latest memo")
    root.remove()
  })

  it("renders the add button", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesCard {...makeProps()} size="M" />, root)
    expect(root.querySelector('[aria-label="记录 Memo"] svg')).toBeTruthy()
    root.remove()
  })

  it("uses the secondary small icon button treatment for adding a memo", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesCard {...makeProps()} size="M" />, root)

    const button = root.querySelector<HTMLButtonElement>('button[aria-label="记录 Memo"]')
    expect(button?.getAttribute("data-variant")).toBe("secondary")
    expect(button?.getAttribute("data-size")).toBe("sm")

    root.remove()
  })

  it("calls openExpand when clicking the add button", () => {
    const props = makeProps()
    props.size = "M"
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesCard {...props} />, root)
    const btn = root.querySelector("button")
    expect(btn).toBeTruthy()
    if (btn) {
      const event = new MouseEvent("click", { bubbles: true })
      btn.dispatchEvent(event)
    }
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(props.host.openExpand).toHaveBeenCalled()
    root.remove()
  })

  it("renders saved notes in L size", async () => {
    const saved = [
      {
        id: "a",
        content: "hello world\nmultiline",
        starred: false,
        createdAt: "2026-01-01T08:00:00Z",
        updatedAt: "2026-01-02T08:00:00Z",
      },
      {
        id: "b",
        content: "second line",
        starred: true,
        createdAt: "2026-01-01T08:00:00Z",
        updatedAt: "2026-01-02T08:00:00Z",
      },
    ]
    const props = makeProps()
    ;(props.data.get as ReturnType<typeof vi.fn>).mockResolvedValue(saved)

    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesCard {...props} />, root)
    await flushMount()
    expect(root.textContent).toContain("hello world")
    expect(root.textContent).toContain("second line")
    root.remove()
  })

  it("renders saved card content as rich text instead of displaying HTML", async () => {
    const props = makeProps({ size: "M" })
    ;(props.data.get as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "rich",
        content: "<p><strong>测试标签</strong></p>",
        starred: false,
        createdAt: "2026-01-01T08:00:00Z",
        updatedAt: "2026-01-02T08:00:00Z",
      },
    ])

    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesCard {...props} />, root)
    await flushMount()

    const content = root.querySelector("[data-tbr-tiptap-root]")
    expect(content?.querySelector("p strong")?.textContent).toBe("测试标签")
    expect(content?.textContent).not.toContain("<p>")
    root.remove()
  })

  it("shows L size limit of 2 preview notes", async () => {
    const saved = [
      {
        id: "1",
        content: "one",
        starred: false,
        createdAt: "2026-01-01T08:00:00Z",
        updatedAt: "2026-01-01T08:00:00Z",
      },
      {
        id: "2",
        content: "two",
        starred: false,
        createdAt: "2026-01-01T08:00:00Z",
        updatedAt: "2026-01-01T08:00:00Z",
      },
      {
        id: "3",
        content: "three",
        starred: false,
        createdAt: "2026-01-01T08:00:00Z",
        updatedAt: "2026-01-01T08:00:00Z",
      },
    ]
    const props = makeProps()
    ;(props.data.get as ReturnType<typeof vi.fn>).mockResolvedValue(saved)

    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesCard {...props} />, root)
    await flushMount()
    expect(root.textContent).toContain("one")
    expect(root.textContent).toContain("two")
    expect(root.textContent).not.toContain("three")
    root.remove()
  })
})

describe("NotesExpand", () => {
  it("renders sidebar and main area", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesExpand {...makeProps()} />, root)
    expect(root.querySelector("[data-widget-expand='notes']")).toBeTruthy()
    expect(root.querySelector("[data-notes-side]")).toBeTruthy()
    expect(root.querySelector("[data-notes-main]")).toBeTruthy()
    root.remove()
  })

  it("uses an icon-only empty state before the first note", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesExpand {...makeProps()} />, root)

    expect(root.querySelector("[data-notes-empty-icon] svg")).toBeTruthy()
    expect(root.textContent).not.toContain("还没有便签")
    expect(root.textContent).toContain("在上方输入框开始记录")
    root.remove()
  })

  it("renders capture editor", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesExpand {...makeProps()} />, root)
    expect(root.querySelector("[data-notes-capture] [data-tbr-tiptap-root]")).toBeTruthy()
    root.remove()
  })

  it("shows a compact tag action alongside the capture actions", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesExpand {...makeProps()} />, root)

    expect(root.querySelector("[data-note-tag-editor]")?.textContent).toContain("添加标签")
    expect(root.querySelector('input[aria-label="添加便签标签"]')).toBeNull()

    const addButton = [...root.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("添加标签"),
    )
    addButton?.click()
    expect(root.querySelector('input[aria-label="添加便签标签"]')).toBeTruthy()
    root.remove()
  })

  it("starts the capture editor without a format toolbar", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesExpand {...makeProps()} />, root)
    expect(root.querySelector("[data-notes-capture] [data-tbr-tiptap-toolbar]")).toBeNull()
    root.remove()
  })

  it("renders search input", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesExpand {...makeProps()} />, root)
    expect(root.querySelector('input[aria-label="搜索便签"]')).toBeTruthy()
    root.remove()
  })

  it("renders calendar via DatePicker", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesExpand {...makeProps()} />, root)
    expect(root.querySelector('button[aria-label="上个月"]')).toBeTruthy()
    expect(root.querySelector('button[aria-label="下个月"]')).toBeTruthy()
    root.remove()
  })

  it("renders filters in sidebar", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesExpand {...makeProps()} />, root)
    expect(root.textContent).toContain("全部")
    expect(root.textContent).toContain("置顶")
    root.remove()
  })

  it("renders note cards from saved data", async () => {
    const saved = [
      {
        id: "x",
        content: "first note",
        starred: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-02",
      },
      {
        id: "y",
        content: "second note",
        tags: ["tag1"],
        starred: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-03",
      },
    ]
    const props = makeProps()
    ;(props.data.get as ReturnType<typeof vi.fn>).mockResolvedValue(saved)

    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesExpand {...props} />, root)
    await flushMount()
    expect(root.textContent).toContain("first note")
    expect(root.textContent).toContain("#tag1")
    expect(root.querySelector("[data-note-star]")).toBeTruthy()
    root.remove()
  })

  it("moves note actions into the more menu without a card footer", async () => {
    const props = makeProps()
    ;(props.data.get as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "actionable",
        content: "actionable",
        starred: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-02",
      },
    ])
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesExpand {...props} />, root)
    await flushMount()

    const note = root.querySelector("[data-note-card]")
    expect(note?.textContent).not.toContain("10 字")
    const moreButton = root.querySelector<HTMLButtonElement>('[aria-label="更多操作"]')
    expect(moreButton).toBeTruthy()
    expect(moreButton?.getAttribute("aria-haspopup")).toBe("menu")
    root.remove()
  })

  it("renders a streamed AI summary from the host-owned chat client", async () => {
    let chatOptions: AiChatClientOptions | undefined
    const client: AiChatClient = {
      async send() {
        chatOptions?.onLoadingChange?.(true)
        chatOptions?.onMessagesChange?.([
          { role: "user", text: "summary request" },
          { role: "assistant", text: "这是总结" },
        ])
        chatOptions?.onLoadingChange?.(false)
      },
      stop: vi.fn(),
      dispose: vi.fn(),
      getMessages: () => [],
    }
    void officialPluginNotes.activate({
      ai: {
        generate: async () => ({ text: "" }),
        stream: async function* () {},
        createChatClient(options: AiChatClientOptions | undefined) {
          chatOptions = options
          return client
        },
      },
      views: { register: () => () => {} },
    } as unknown as PluginContext)

    const props = makeProps()
    ;(props.data.get as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "summary",
        content: "需要总结的便签",
        starred: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-02",
      },
    ])
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesExpand {...props} />, root)
    await flushMount()

    const moreButton = root.querySelector<HTMLButtonElement>("[aria-label='更多操作']")
    moreButton?.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0 }))
    await flushMount()
    const summarize = [...document.querySelectorAll<HTMLElement>("[role='menuitem']")].find(
      (item) => item.textContent?.includes("AI 总结"),
    )
    expect(summarize).toBeTruthy()
    summarize?.dispatchEvent(new PointerEvent("pointerup", { bubbles: true, button: 0 }))
    await flushMount()

    expect(root.textContent).toContain("这是总结")
    root.remove()
  })

  it("shows tag in sidebar from saved data", async () => {
    const saved = [
      {
        id: "z",
        content: "tagged note",
        tags: ["test"],
        starred: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-04",
      },
    ]
    const props = makeProps()
    ;(props.data.get as ReturnType<typeof vi.fn>).mockResolvedValue(saved)

    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesExpand {...props} />, root)
    await flushMount()
    expect(root.textContent).toContain("test")
    root.remove()
  })

  it("shows removable active filters between the capture editor and note list", async () => {
    const props = makeProps()
    ;(props.data.get as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: "tagged",
        content: "tagged note",
        tags: ["工作"],
        starred: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-04",
      },
    ])
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesExpand {...props} />, root)
    await flushMount()

    const starredFilter = [...root.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("置顶"),
    )
    const tagFilter = [...root.querySelectorAll("button")].find((button) =>
      button.textContent?.includes("工作"),
    )
    starredFilter?.click()
    tagFilter?.click()

    const activeFilters = root.querySelector("[data-notes-active-filters]")
    expect(activeFilters?.textContent).toContain("工作")
    expect(activeFilters?.textContent).toContain("置顶")
    root.querySelector<HTMLButtonElement>("button[aria-label='清除标签 工作']")?.click()
    expect(root.querySelector("[data-notes-active-filters]")?.textContent).toContain("置顶")
    root.remove()
  })

  it("does not enter edit mode when a note is clicked", async () => {
    const saved = [
      {
        id: "e",
        content: "editable",
        starred: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]
    const props = makeProps()
    ;(props.data.get as ReturnType<typeof vi.fn>).mockResolvedValue(saved)

    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesExpand {...props} />, root)
    await flushMount()

    const display = root.querySelector("[data-note-display]")
    expect(display).toBeTruthy()
    if (display) {
      const event = new MouseEvent("click", { bubbles: true })
      display.dispatchEvent(event)
    }
    await flushMount()
    expect(root.querySelector("[data-note-card][data-editing]")).toBeNull()
    expect(root.querySelector('[aria-label="更多操作"]')).toBeTruthy()
    root.remove()
  })
})
