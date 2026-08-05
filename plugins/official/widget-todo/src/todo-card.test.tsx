import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { TodoCard } from "./todo-card"
import type { WidgetViewProps } from "@tabora/plugin-api/sdk"

function makeProps(): WidgetViewProps {
  return {
    instanceId: "todo-1",
    pluginId: "official.widgets.todo",
    contributionId: "todo",
    size: "M",
    supportedSizes: ["M", "L"],
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

describe("TodoCard", () => {
  async function flushMount() {
    await Promise.resolve()
    await Promise.resolve()
  }

  it("renders the compact next-task card at M size", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <TodoCard {...makeProps()} />, root)
    await flushMount()
    expect(root.querySelector("[data-todo-card]")).toBeTruthy()
    expect(root.querySelector(".todo-card-widget")).toBeNull()
    expect(root.textContent).toContain("Next task")
    root.remove()
  })

  it("shows the next-task progress bar instead of an expand button", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <TodoCard {...makeProps()} />, root)
    await flushMount()
    // 设计稿的 M 卡只有「下一项 + 进度条」，展开走卡片双击
    expect(root.querySelector("[data-todo-expand]")).toBeNull()
    expect(root.textContent).toContain("点击完成")
    root.remove()
  })

  it("renders the timeline composition at L size", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <TodoCard {...makeProps()} size="L" />, root)
    await flushMount()
    expect(root.querySelector("[data-todo-variant='L']")).toBeTruthy()
    expect(root.textContent).toContain("今日计划")
    expect(root.textContent).toContain("项待处理")
    root.remove()
  })

  it("renders the two-column board at XL size", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <TodoCard {...makeProps()} size="XL" />, root)
    await flushMount()
    expect(root.querySelector("[data-todo-variant='XL']")).toBeTruthy()
    expect(root.textContent).toContain("任务看板")
    expect(root.textContent).toContain("今天")
    expect(root.textContent).toContain("稍后")
    root.remove()
  })

  it("renders the progress ring at S size", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <TodoCard {...makeProps()} size="S" />, root)
    await flushMount()
    expect(root.querySelector("[data-todo-variant='S']")).toBeTruthy()
    expect(root.textContent).toContain("下一项")
    expect(root.textContent).toContain("33%")
    root.remove()
  })

  it("uses prototype default task copy", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <TodoCard {...makeProps()} />, root)
    await flushMount()
    expect(root.textContent).toContain("补齐 widget 尺寸菜单")
    root.remove()
  })

  it("renders the size-specific todo composition", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <TodoCard {...makeProps()} />, root)
    await flushMount()

    expect(root.querySelector("[data-todo-variant='M']")).toBeTruthy()
    root.remove()
  })

  // 空态藏在 loading 门后面，两次 microtask 不够，等目标文案出现
  async function flushUntilText(root: HTMLElement, text: string) {
    for (let i = 0; i < 50 && !root.textContent?.includes(text); i += 1) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
  }

  // 空态与全部完成态走的是抽出来的 NextTaskEmpty / *Ring 组件，单独兜一遍
  function makeEmptyProps(size: WidgetViewProps["size"]): WidgetViewProps {
    const props = makeProps()
    return {
      ...props,
      size,
      data: { ...props.data, get: vi.fn().mockResolvedValue([]) },
    }
  }

  it("prompts to create the first task when M has no items", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <TodoCard {...makeEmptyProps("M")} />, root)
    await flushMount()
    await flushUntilText(root, "添加第一项待办")
    expect(root.textContent).toContain("添加第一项待办")
    expect(root.textContent).toContain("今天 · 点击创建")
    root.remove()
  })

  it("shows the all-done state at M when every item is completed", async () => {
    const props = makeProps()
    const done = {
      ...props,
      data: {
        ...props.data,
        get: vi.fn().mockResolvedValue([{ id: "a", text: "已完成的任务", done: true }]),
      },
    }
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <TodoCard {...done} />, root)
    await flushMount()
    await flushUntilText(root, "今天的任务已完成")
    expect(root.textContent).toContain("今天的任务已完成")
    expect(root.textContent).toContain("可以休息一下")
    root.remove()
  })

  it("shows 0% and the empty hint at S with no items", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <TodoCard {...makeEmptyProps("S")} />, root)
    await flushMount()
    expect(root.textContent).toContain("0%")
    expect(root.textContent).toContain("点击添加第一项待办")
    root.remove()
  })

  it("offers the timeline empty action at L with no items", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <TodoCard {...makeEmptyProps("L")} />, root)
    await flushMount()
    await flushUntilText(root, "添加今天的第一项任务")
    expect(root.textContent).toContain("添加今天的第一项任务")
    root.remove()
  })
})
