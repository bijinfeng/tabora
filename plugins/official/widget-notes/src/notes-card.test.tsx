import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { WidgetViewProps } from "@tabora/plugin-api/sdk"
import { makeWidgetViewProps } from "../../test-support/widgetViewProps"
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

  it("renders capture textarea", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesExpand {...makeProps()} />, root)
    expect(root.querySelector("[data-notes-capture] textarea")).toBeTruthy()
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
        content: "second #tag1 note",
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

  it("shows tag in sidebar from saved data", async () => {
    const saved = [
      {
        id: "z",
        content: "tagged #test note",
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

  it("enters edit mode on card click", async () => {
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
    expect(root.querySelector("[data-note-card][data-editing] textarea")).toBeTruthy()
    root.remove()
  })
})
