import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { JSX } from "solid-js"
import type { WidgetSize } from "@tabora/plugin-api"

import { WorkbenchAddWidgetModal } from "./WorkbenchAddWidgetModal"
import type { AvailableWidget } from "./WorkbenchShellChrome.types"

const widgets: AvailableWidget[] = [
  {
    pluginId: "official.widgets",
    id: "widget.notes",
    title: "便签",
    description: "快速记录",
    source: "official",
    supportedSizes: ["S", "M"],
    defaultSize: "M",
  },
]

function mount(overrides?: {
  onClose?: () => void
  onAdd?: () => void
  renderWidgetPreview?: (pluginId: string, widgetId: string, size: WidgetSize) => JSX.Element
}) {
  const root = document.createElement("div")
  document.body.appendChild(root)
  const onClose = overrides?.onClose ?? vi.fn()
  const onAdd = overrides?.onAdd ?? vi.fn()

  const dispose = render(
    () => (
      <WorkbenchAddWidgetModal
        open
        availableWidgets={widgets}
        renderWidgetIcon={() => <span />}
        {...(overrides?.renderWidgetPreview
          ? { renderWidgetPreview: overrides.renderWidgetPreview }
          : {})}
        onAdd={onAdd}
        onClose={onClose}
      />
    ),
    root,
  )

  const overlay = root.querySelector("[data-workbench-overlay='add-widget']") as HTMLElement
  return {
    overlay,
    onAdd,
    onClose,
    dispose: () => {
      dispose()
      root.remove()
    },
  }
}

// 真实按键派发到当前焦点元素再冒泡。直接在 overlay 上 dispatch 会绕过焦点，
// 那样即使弹窗从未获得焦点测试也会通过，测不出这个 bug。
function pressKeyOnFocusedElement(key: string) {
  const target = document.activeElement ?? document.body
  target.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key }))
}

describe("WorkbenchAddWidgetModal", () => {
  // 回归：键盘处理挂在 overlay 上，靠冒泡拿事件。打开时不主动聚焦的话，
  // 用户点进弹窗之前 Esc / Enter / 上下键全部无效。
  it("打开后立即把焦点放到 overlay 上", () => {
    const { overlay, dispose } = mount()
    expect(document.activeElement).toBe(overlay)
    dispose()
  })

  it("打开后直接按 Esc 就能关闭，无需先点击弹窗", () => {
    const onClose = vi.fn()
    const { dispose } = mount({ onClose })

    pressKeyOnFocusedElement("Escape")

    expect(onClose).toHaveBeenCalledTimes(1)
    dispose()
  })

  it("打开后直接按 Enter 就能确认添加选中卡片", () => {
    const onAdd = vi.fn()
    const { dispose } = mount({ onAdd })

    pressKeyOnFocusedElement("Enter")

    expect(onAdd).toHaveBeenCalledWith("official.widgets", "widget.notes", "M")
    dispose()
  })

  it("关闭时把焦点还给打开弹窗的元素", () => {
    const trigger = document.createElement("button")
    document.body.appendChild(trigger)
    trigger.focus()
    expect(document.activeElement).toBe(trigger)

    const { dispose } = mount()
    dispose()

    expect(document.activeElement).toBe(trigger)
    trigger.remove()
  })

  it("首个筛选 tab 是「全部」且默认选中", () => {
    const { overlay, dispose } = mount()

    const tabs = [...overlay.querySelectorAll("[role='tab']")] as HTMLElement[]
    expect(tabs.map((tab) => tab.textContent)).toEqual(["全部", "信息", "生产力", "工具", "已安装"])
    expect(tabs[0]?.getAttribute("aria-selected")).toBe("true")
    dispose()
  })

  // 回归：预览曾经是弹窗自己画的仿卡片，卡片样式和插件视图改动都不会反映到这里。
  it("预览渲染插件真实 card view，并带上当前选中尺寸", () => {
    const renderWidgetPreview = vi.fn((_pluginId: string, _widgetId: string, size: WidgetSize) => (
      <div data-testid="real-card-view">real:{size}</div>
    ))
    const { overlay, dispose } = mount({ renderWidgetPreview })

    const rendered = overlay.querySelector("[data-testid='real-card-view']")
    expect(rendered?.textContent).toBe("real:M")
    expect(renderWidgetPreview).toHaveBeenCalledWith("official.widgets", "widget.notes", "M")
    dispose()
  })

  it("拿不到 card view 时退回描述文案，不是空白卡片", () => {
    const { overlay, dispose } = mount({ renderWidgetPreview: () => null })

    const grid = overlay.querySelector("[data-add-widget-preview-grid]") as HTMLElement
    expect(grid.textContent).toContain("快速记录")
    dispose()
  })
})
