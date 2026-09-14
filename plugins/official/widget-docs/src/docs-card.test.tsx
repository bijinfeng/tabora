import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import type { WidgetViewProps } from "@tabora/plugin-api/sdk"
import { makeWidgetViewProps } from "../../test-support/widgetViewProps"
import { DocsCard } from "./docs-card"
import { DocsExpand } from "./docs-expand"
import { DOCS_STORAGE_KEY, docTitle, type Doc } from "./docs-data"

function makeProps(overrides: Partial<WidgetViewProps> = {}): WidgetViewProps {
  return makeWidgetViewProps({
    instanceId: "docs-1",
    pluginId: "official.widgets.docs",
    contributionId: "docs",
    size: "L",
    ...overrides,
  })
}

async function flushMount() {
  await Promise.resolve()
  await Promise.resolve()
}

const sampleDoc: Doc = {
  id: "doc-1",
  title: "会议纪要",
  content: "<p>讨论了下一步计划</p>",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

describe("docTitle", () => {
  it("prefers an explicit title", () => {
    expect(docTitle({ title: "标题", content: "<p>正文</p>" })).toBe("标题")
  })

  it("falls back to stripped content when title is empty", () => {
    expect(docTitle({ title: "", content: "<p>纯正文内容</p>" })).toBe("纯正文内容")
  })

  it("uses a placeholder when both are empty", () => {
    expect(docTitle({ title: "", content: "" })).toBe("未命名文档")
  })
})

describe("DocsCard", () => {
  it("renders the empty state before docs load", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <DocsCard {...makeProps()} />, root)
    expect(root.textContent).toContain("文档笔记")
    root.remove()
  })

  it("opens the expand view when clicked", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    let opened = 0
    const props = makeWidgetViewProps({
      pluginId: "official.widgets.docs",
      contributionId: "docs",
      size: "L",
      host: {
        openExpand: () => {
          opened++
        },
      },
    })
    render(() => <DocsCard {...props} />, root)
    root.querySelector<HTMLElement>('[role="button"]')?.click()
    expect(opened).toBeGreaterThan(0)
    root.remove()
  })

  it("keeps the small card concise while preserving its expand action", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    let opened = 0
    const get = async <T = unknown,>(key: string) =>
      (key === DOCS_STORAGE_KEY ? [sampleDoc] : undefined) as T | undefined
    const props = makeWidgetViewProps({
      size: "S",
      data: { get },
      host: { openExpand: () => opened++ },
    })

    render(() => <DocsCard {...props} />, root)
    await flushMount()

    expect(root.textContent).toContain("会议纪要")
    expect(root.textContent).not.toContain("查看全部")
    root.querySelector<HTMLElement>('[role="button"]')?.click()
    expect(opened).toBe(1)
    root.remove()
  })
})

describe("DocsExpand", () => {
  it("lists stored docs and shows the two-column layout", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const get = async <T = unknown,>(key: string) =>
      (key === DOCS_STORAGE_KEY ? [sampleDoc] : undefined) as T | undefined
    const props = makeWidgetViewProps({
      pluginId: "official.widgets.docs",
      contributionId: "docs",
      size: "L",
      data: { get },
    })
    render(() => <DocsExpand {...props} />, root)
    await flushMount()
    expect(root.textContent).toContain("会议纪要")
    expect(root.querySelector('[aria-label="搜索文档"]')).toBeTruthy()
    root.remove()
  })

  it("shows the empty main panel when there are no docs", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <DocsExpand {...makeProps()} />, root)
    await flushMount()
    expect(root.textContent).toContain("选择或新建一篇文档")
    root.remove()
  })
})
