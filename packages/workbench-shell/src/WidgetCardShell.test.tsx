import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { PluginInstance } from "@tabora/plugin-api"
import { WidgetCardShell, type WidgetHostCallbacks } from "./WidgetCardShell"

function makeInstance(): PluginInstance {
  return {
    id: "w1",
    workspaceId: "ws",
    contribution: { pluginId: "p", kind: "widget", id: "c" },
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

// jsdom 在部分版本里没有 PointerEvent 构造器，回退成带坐标的 MouseEvent；
// 组件只读 target / clientX / clientY，两者等价。
function pointerDown(coords: { clientX: number; clientY: number }): Event {
  const init = { bubbles: true, ...coords }
  if (typeof PointerEvent === "function") {
    return new PointerEvent("pointerdown", init)
  }
  return new MouseEvent("pointerdown", init)
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
  it("渲染无头部卡片壳和满铺子内容", () => {
    const { host, dispose } = mount(makeCallbacks())
    expect(host.querySelector("[data-testid='content']")).toBeTruthy()
    expect(host.querySelector("[data-workbench-grid-item]")).toBeTruthy()
    expect(host.querySelector("[data-widget-card]")).toBeTruthy()
    expect(host.querySelector("[data-workbench-grid-item]")?.getAttribute("aria-label")).toBe(
      "便签",
    )
    // 无 header：插件内容占满卡片，卡片本体作为拖拽手柄。
    expect(host.querySelector("[data-widget-card-header]")).toBeNull()
    expect(host.querySelector("[data-widget-card-title]")).toBeTruthy()
    expect(host.querySelector("[data-widget-card-body]")).toBeTruthy()
    expect(host.querySelector("[data-widget-card-body]")?.textContent).toContain("内容")
    expect(host.querySelector(".grid-item")).toBeNull()
    expect(host.querySelector(".widget-card")).toBeNull()
    dispose()
  })

  it("通过 CSS 变量暴露当前尺寸跨度，而不是写死内联网格属性", () => {
    const { host, dispose } = mount(makeCallbacks())
    const card = host.querySelector("[data-widget-instance-id='w1']") as HTMLElement
    expect(card.style.getPropertyValue("--widget-col-span")).toBe("2")
    expect(card.style.getPropertyValue("--widget-row-span")).toBe("1")
    expect(card.style.gridColumn).toBe("")
    expect(card.style.gridRow).toBe("")
    dispose()
  })

  it("移动端网格保留卡片真实跨度并填满网格单元", () => {
    const { host, dispose } = mount(makeCallbacks(), { mobileGrid: true })
    const card = host.querySelector("[data-widget-instance-id='w1']") as HTMLElement

    expect(card.style.getPropertyValue("--widget-narrow-col")).toBe("span 2")
    expect(card.style.getPropertyValue("--widget-narrow-row")).toBe("span 1")
    expect(card.style.getPropertyValue("--widget-narrow-card-height")).toBe("100%")
    expect(card.style.getPropertyValue("--widget-narrow-min-height")).toBe("0px")
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
    const removeBtn = host.querySelector("[data-widget-card-remove]") as HTMLButtonElement
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
    const removeBtn = host.querySelector("[data-widget-card-remove]") as HTMLButtonElement
    expect(removeBtn.getAttribute("aria-label")).toBe("Remove 便签")
    dispose()
  })

  it("移除按钮使用紧凑、清晰的危险图标按钮", () => {
    const { host, dispose } = mount(makeCallbacks())
    const removeBtn = host.querySelector("[data-widget-card-remove]") as HTMLButtonElement

    expect(removeBtn.getAttribute("data-variant")).toBe("danger-subtle")
    expect(removeBtn.getAttribute("data-shape")).toBe("circle")
    expect(removeBtn.style.width).toBe("")
    expect(removeBtn.style.height).toBe("")
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

  // 卡片带 tabIndex=0 会进入 Tab 序，但展开原先只有指针路径，键盘用户聚焦后无操作可做。
  it("键盘 Enter / 空格在聚焦卡片时触发展开", () => {
    const cb = makeCallbacks()
    const { host, dispose } = mount(cb)
    const card = host.querySelector("[data-widget-instance-id='w1']") as HTMLElement

    card.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }))
    expect(cb.onExpand).toHaveBeenCalledTimes(1)

    card.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: " " }))
    expect(cb.onExpand).toHaveBeenCalledTimes(2)
    dispose()
  })

  it("卡片内控件上的 Enter 不冒泡成展开", () => {
    const cb = makeCallbacks()
    const { host, dispose } = mount(cb)
    const removeBtn = host.querySelector("[data-widget-card-remove]") as HTMLButtonElement

    removeBtn.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "Enter" }))

    expect(cb.onExpand).not.toHaveBeenCalled()
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

  // 回归：dnd-kit 激活拖拽时对 pointerdown 调 preventDefault，会抑制 mousedown /
  // click / dblclick。真实指针下 click 根本不派发，只能靠 pointerdown 判双击。
  it("两次相邻 pointerdown 触发展开（click 被 dnd-kit 抑制时的真实指针路径）", () => {
    const cb = makeCallbacks()
    const { host, dispose } = mount(cb)
    const card = host.querySelector("[data-widget-instance-id='w1']") as HTMLElement

    card.dispatchEvent(pointerDown({ clientX: 50, clientY: 50 }))
    card.dispatchEvent(pointerDown({ clientX: 51, clientY: 50 }))

    expect(cb.onExpand).toHaveBeenCalledTimes(1)
    dispose()
  })

  it("单次 pointerdown 不触发展开", () => {
    const cb = makeCallbacks()
    const { host, dispose } = mount(cb)
    const card = host.querySelector("[data-widget-instance-id='w1']") as HTMLElement

    card.dispatchEvent(pointerDown({ clientX: 50, clientY: 50 }))

    expect(cb.onExpand).not.toHaveBeenCalled()
    dispose()
  })

  it("两次 pointerdown 间距过大时不算双击", () => {
    const cb = makeCallbacks()
    const { host, dispose } = mount(cb)
    const card = host.querySelector("[data-widget-instance-id='w1']") as HTMLElement

    card.dispatchEvent(pointerDown({ clientX: 50, clientY: 50 }))
    card.dispatchEvent(pointerDown({ clientX: 200, clientY: 50 }))

    expect(cb.onExpand).not.toHaveBeenCalled()
    dispose()
  })

  it("两次 pointerdown 间隔过久时不算双击", async () => {
    vi.useFakeTimers()
    const cb = makeCallbacks()
    const { host, dispose } = mount(cb)
    const card = host.querySelector("[data-widget-instance-id='w1']") as HTMLElement

    card.dispatchEvent(pointerDown({ clientX: 50, clientY: 50 }))
    vi.advanceTimersByTime(600)
    card.dispatchEvent(pointerDown({ clientX: 50, clientY: 50 }))

    expect(cb.onExpand).not.toHaveBeenCalled()
    dispose()
    vi.useRealTimers()
  })

  it("三击只展开一次", () => {
    const cb = makeCallbacks()
    const { host, dispose } = mount(cb)
    const card = host.querySelector("[data-widget-instance-id='w1']") as HTMLElement

    card.dispatchEvent(pointerDown({ clientX: 50, clientY: 50 }))
    card.dispatchEvent(pointerDown({ clientX: 50, clientY: 50 }))
    card.dispatchEvent(pointerDown({ clientX: 50, clientY: 50 }))

    expect(cb.onExpand).toHaveBeenCalledTimes(1)
    dispose()
  })

  it("在移除按钮上双击不展开", () => {
    const cb = makeCallbacks()
    const { host, dispose } = mount(cb)
    const removeButton = host.querySelector("[data-widget-card-remove]") as HTMLElement

    removeButton.dispatchEvent(pointerDown({ clientX: 50, clientY: 50 }))
    removeButton.dispatchEvent(pointerDown({ clientX: 50, clientY: 50 }))

    expect(cb.onExpand).not.toHaveBeenCalled()
    dispose()
  })

  it("真实指针双击后紧随的合成 click 不重复展开", () => {
    const cb = makeCallbacks()
    const { host, dispose } = mount(cb)
    const card = host.querySelector("[data-widget-instance-id='w1']") as HTMLElement

    card.dispatchEvent(pointerDown({ clientX: 50, clientY: 50 }))
    card.dispatchEvent(pointerDown({ clientX: 50, clientY: 50 }))
    // 浏览器若仍派发 click(detail=2)，不应再展开一次。
    card.dispatchEvent(new MouseEvent("click", { bubbles: true, detail: 2 }))

    expect(cb.onExpand).toHaveBeenCalledTimes(1)
    dispose()
  })

  it("启用 sortable 绑定时把卡片网格项同时作为根节点和拖拽手柄交给外部库", () => {
    const cb = {
      ...makeCallbacks(),
      bindSortableRoot: vi.fn(),
      bindSortableHandle: vi.fn(),
    }
    const { host, dispose } = mount(cb)

    expect(cb.bindSortableRoot).toHaveBeenCalledWith(
      host.querySelector("[data-widget-instance-id='w1']"),
    )
    expect(cb.bindSortableHandle).toHaveBeenCalledWith(
      host.querySelector("[data-widget-instance-id='w1']"),
    )
    dispose()
  })
})
