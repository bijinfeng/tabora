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
    onDblClick: vi.fn(),
    onContextMenu: vi.fn(),
    onResize: vi.fn(),
    onRemove: vi.fn(),
    onExpand: vi.fn(),
    isDragging: false,
  }
}

function mount(cb: WidgetHostCallbacks, props?: Record<string, unknown>) {
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
        {...(props as object)}
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

  it("通过 CSS 变量暴露当前尺寸跨度，而不是写死内联网格属性", () => {
    const { host, dispose } = mount(makeCallbacks())
    const card = host.querySelector("[data-widget-instance-id='w1']") as HTMLElement
    expect(card.style.getPropertyValue("--widget-col-span")).toBe("4")
    expect(card.style.getPropertyValue("--widget-row-span")).toBe("1")
    expect(card.style.gridColumn).toBe("")
    expect(card.style.gridRow).toBe("")
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

  it("uses injected remove aria label", () => {
    const cb = makeCallbacks()
    const { host, dispose } = mount(cb, {
      copy: {
        removeAriaLabel: (title: string) => `Remove ${title}`,
      },
    })
    const removeBtn = host.querySelector("button.card-danger") as HTMLButtonElement
    expect(removeBtn.getAttribute("aria-label")).toBe("Remove 便签")
    dispose()
  })

  it("右键触发 onContextMenu", () => {
    const cb = makeCallbacks()
    const { host, dispose } = mount(cb)
    const card = host.querySelector("[data-widget-instance-id='w1']") as HTMLElement
    const event = new MouseEvent("contextmenu", { bubbles: true, cancelable: true })
    card.dispatchEvent(event)
    expect(cb.onContextMenu).toHaveBeenCalled()
    expect(event.defaultPrevented).toBe(true)
    dispose()
  })

  it("does not render a visible expand button because prototype uses double-click", () => {
    const { host, dispose } = mount(makeCallbacks())
    expect(host.querySelector("button[aria-label^='展开']")).toBeNull()
    dispose()
  })

  it("双击卡片区域触发展开，即使浏览器只提供 click detail", () => {
    const cb = makeCallbacks()
    const { host, dispose } = mount(cb)
    const card = host.querySelector("[data-widget-instance-id='w1']") as HTMLElement

    card.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 1 }))
    card.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 2 }))

    expect(cb.onExpand).toHaveBeenCalledTimes(1)
    dispose()
  })

  it("启用 sortable 绑定时把根节点和标题拖拽手柄交给外部库", () => {
    const cb = {
      ...makeCallbacks(),
      bindSortableRoot: vi.fn(),
      bindSortableHandle: vi.fn(),
    }
    const { host, dispose } = mount(cb)

    expect(cb.bindSortableRoot).toHaveBeenCalledWith(
      host.querySelector("[data-widget-instance-id='w1']"),
    )
    expect(cb.bindSortableHandle).toHaveBeenCalledWith(host.querySelector(".card-title"))
    dispose()
  })
})
