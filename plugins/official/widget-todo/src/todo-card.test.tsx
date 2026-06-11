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

  it("renders add input", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <TodoCard {...makeProps()} />, root)
    expect(root.querySelector("input")).toBeTruthy()
    root.remove()
  })

  it("uses prototype default task copy", async () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <TodoCard {...makeProps()} />, root)
    await flushMount()
    expect(root.textContent).toContain("复核 Dashboard / Focus 布局协议")
    expect(root.textContent).toContain("补齐 widget 尺寸菜单与展开态")
    expect(root.textContent).toContain("清理插件设置中的导入导出后置项")
    root.remove()
  })
})
