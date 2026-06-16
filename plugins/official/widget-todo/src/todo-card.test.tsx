import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { TodoCard } from "./todo-card"
import type { WidgetViewProps } from "@tabora/plugin-api"

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

  it("renders group header and filter tabs", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <TodoCard {...makeProps()} />, root)
    await flushMount()
    expect(root.textContent).toContain("未完成")
    expect(root.textContent).toContain("全部")
    expect(root.textContent).toContain("默认分组")
    root.remove()
  })

  it("renders expand button", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const props = makeProps()
    render(() => <TodoCard {...props} />, root)
    const expandBtn = root.querySelector(".card-expand-btn")
    expect(expandBtn).toBeTruthy()
    expect(expandBtn?.textContent).toContain("展开")
    root.remove()
  })

  it("uses prototype default task copy", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <TodoCard {...makeProps()} />, root)
    await flushMount()
    expect(root.textContent).toContain("补齐 widget 尺寸菜单")
    expect(root.textContent).toContain("清理插件设置中的导入导出项")
    root.remove()
  })
})
