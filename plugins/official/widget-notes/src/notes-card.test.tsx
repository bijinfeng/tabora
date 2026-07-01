import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { NotesCard } from "./notes-card"
import { NotesExpand } from "./notes-expand"
import type { WidgetViewProps } from "@tabora/plugin-api"

function makeProps(): WidgetViewProps {
  return {
    instanceId: "notes-1",
    pluginId: "official.widgets.notes",
    contributionId: "notes",
    size: "L",
    supportedSizes: ["S", "M", "L", "XL"],
    config: {},
    data: {
      get: vi.fn().mockResolvedValue(undefined),
      save: vi.fn().mockResolvedValue(undefined),
    },
    host: {
      updateConfig: vi.fn().mockResolvedValue(undefined),
      removeInstance: vi.fn().mockResolvedValue(undefined),
      requestResize: vi.fn().mockResolvedValue(undefined),
      openModal: vi.fn(),
      closeModal: vi.fn(),
      openExpand: vi.fn(),
      showToast: vi.fn(),
      openExternal: vi.fn().mockResolvedValue(true),
    },
  }
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
    expect(root.querySelector(".notes-widget")).toBeTruthy()
    root.remove()
  })

  it("renders the new note button", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesCard {...makeProps()} />, root)
    expect(root.textContent).toContain("新建便签")
    root.remove()
  })

  it("calls openExpand when clicking the new note button", () => {
    const props = makeProps()
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesCard {...props} />, root)
    const btn = root.querySelector(".notes-widget-foot button")
    expect(btn).toBeTruthy()
    if (btn) {
      const event = new MouseEvent("click", { bubbles: true })
      btn.dispatchEvent(event)
    }
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(props.host.openExpand).toHaveBeenCalled()
    root.remove()
  })

  it("renders saved notes", async () => {
    const saved = [
      {
        id: "a",
        content: "hello world",
        starred: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-02",
      },
      {
        id: "b",
        content: "second line",
        starred: true,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-02",
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
    expect(root.querySelector(".notes-widget-row.starred")).toBeTruthy()
    root.remove()
  })

  it("shows up to 4 notes", async () => {
    const saved = [
      { id: "1", content: "one", starred: false, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
      { id: "2", content: "two", starred: false, createdAt: "2026-01-01", updatedAt: "2026-01-01" },
      {
        id: "3",
        content: "three",
        starred: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      {
        id: "4",
        content: "four",
        starred: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
      {
        id: "5",
        content: "five",
        starred: false,
        createdAt: "2026-01-01",
        updatedAt: "2026-01-01",
      },
    ]
    const props = makeProps()
    ;(props.data.get as ReturnType<typeof vi.fn>).mockResolvedValue(saved)

    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesCard {...props} />, root)
    await flushMount()
    expect(root.textContent).toContain("one")
    expect(root.textContent).toContain("four")
    expect(root.textContent).not.toContain("five")
    root.remove()
  })
})

describe("NotesExpand", () => {
  it("renders sidebar and main area", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesExpand {...makeProps()} />, root)
    expect(root.querySelector(".notes-side")).toBeTruthy()
    expect(root.querySelector(".notes-main")).toBeTruthy()
    root.remove()
  })

  it("renders capture textarea", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesExpand {...makeProps()} />, root)
    expect(root.querySelector(".notes-capture textarea")).toBeTruthy()
    root.remove()
  })

  it("renders search input", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesExpand {...makeProps()} />, root)
    expect(root.querySelector(".notes-side-search input")).toBeTruthy()
    root.remove()
  })

  it("renders calendar via DatePicker", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <NotesExpand {...makeProps()} />, root)
    expect(root.querySelector(".tbr-date-picker-label")).toBeTruthy()
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
    expect(root.querySelector(".notes-card-star")).toBeTruthy()
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

    const display = root.querySelector(".notes-card-display")
    expect(display).toBeTruthy()
    if (display) {
      const event = new MouseEvent("click", { bubbles: true })
      display.dispatchEvent(event)
    }
    await flushMount()
    expect(root.querySelector(".notes-card-edit-area textarea")).toBeTruthy()
    root.remove()
  })
})
