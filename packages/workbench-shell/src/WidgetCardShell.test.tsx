import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { PluginInstance } from "@tabora/plugin-api"
import { WidgetCardShell, type WidgetHostCallbacks } from "./WidgetCardShell"

function makeInstance(): PluginInstance {
  return {
    id: "w1",
    workspaceId: "ws",
    pluginId: "p",
    contributionId: "c",
    extensionPoint: "widget",
    regionId: "grid",
    enabled: true,
    size: "M",
    config: {},
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }
}

function makeCallbacks(): WidgetHostCallbacks {
  return {
    onDragStart: vi.fn(),
    onDragOver: vi.fn(),
    onDrop: vi.fn(),
    onDblClick: vi.fn(),
    onContextMenu: vi.fn(),
    onResize: vi.fn(),
    onRemove: vi.fn(),
    onExpand: vi.fn(),
    isDragging: false,
  }
}

function mount(cb: WidgetHostCallbacks) {
  const host = document.createElement("div")
  document.body.appendChild(host)
  const dispose = render(
    () => (
      <WidgetCardShell
        instance={makeInstance()}
        title="便签"
        supportedSizes={["S", "M", "L"]}
        currentSize="M"
        callbacks={cb}
      >
        <div data-testid="content">内容</div>
      </WidgetCardShell>
    ),
    host,
  )
  return { host, dispose }
}

describe("WidgetCardShell", () => {
  it("渲染标题和子内容", () => {
    const { host, dispose } = mount(makeCallbacks())
    expect(host.textContent).toContain("便签")
    expect(host.querySelector("[data-testid='content']")).toBeTruthy()
    dispose()
  })

  it("按当前尺寸设置网格列跨度", () => {
    const { host, dispose } = mount(makeCallbacks())
    const card = host.querySelector("[data-widget-instance-id='w1']") as HTMLElement
    expect(card.style.gridColumn).toBe("span 2")
    dispose()
  })

  it("标题栏不渲染尺寸切换按钮", () => {
    const { host, dispose } = mount(makeCallbacks())
    expect(host.querySelector("button.widget-size-btn")).toBeFalsy()
    dispose()
  })

  it("点击删除触发 onRemove", () => {
    const cb = makeCallbacks()
    const { host, dispose } = mount(cb)
    const removeBtn = host.querySelector("button.card-danger") as HTMLButtonElement
    removeBtn.click()
    expect(cb.onRemove).toHaveBeenCalled()
    dispose()
  })

  it("右键触发 onContextMenu", () => {
    const cb = makeCallbacks()
    const { host, dispose } = mount(cb)
    const card = host.querySelector("[data-widget-instance-id='w1']") as HTMLElement
    card.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true }))
    expect(cb.onContextMenu).toHaveBeenCalled()
    dispose()
  })

  it("点击展开按钮触发 onExpand", () => {
    const cb = makeCallbacks()
    const { host, dispose } = mount(cb)
    const expandBtn = host.querySelector("button[aria-label^='展开']") as HTMLButtonElement
    expandBtn.click()
    expect(cb.onExpand).toHaveBeenCalled()
    dispose()
  })
})
