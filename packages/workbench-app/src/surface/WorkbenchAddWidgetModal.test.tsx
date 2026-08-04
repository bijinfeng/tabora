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
  availableWidgets?: AvailableWidget[]
}) {
  const root = document.createElement("div")
  document.body.appendChild(root)
  const onClose = overrides?.onClose ?? vi.fn()
  const onAdd = overrides?.onAdd ?? vi.fn()

  const dispose = render(
    () => (
      <WorkbenchAddWidgetModal
        open
        availableWidgets={overrides?.availableWidgets ?? widgets}
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

  // 回归：预览卡片只展示外观，不该出现工作台上的移除按钮。
  it("预览卡片不渲染移除按钮", () => {
    const { overlay, dispose } = mount({})

    const grid = overlay.querySelector("[data-add-widget-preview-grid]") as HTMLElement
    expect(grid.querySelector("[data-widget-card-remove]")).toBeNull()
    dispose()
  })

  // 回归：切换尺寸后，舞台的 grid track 数与卡片自身的 span 必须一致，
  // 否则卡片按旧 span 占位、填不满新舞台（曾因 WidgetCardShell 挂载时定型 span 复现）。
  it("切换尺寸后舞台 track 与卡片 span 一致，各比例正确", () => {
    const { overlay, dispose } = mount({
      availableWidgets: [
        {
          pluginId: "official.widgets",
          id: "widget.full",
          title: "全尺寸卡片",
          description: "d",
          source: "official",
          supportedSizes: ["S", "M", "L", "XL"],
          defaultSize: "M",
        },
      ],
    })

    const stage = overlay.querySelector("[data-add-widget-preview-grid]") as HTMLElement
    // 每次尺寸变化 SizeSelector 会重渲染按钮，捕获的旧引用会失效，故每轮重新查询。
    const clickSize = (label: string) => {
      const btn = [...overlay.querySelectorAll("[role='dialog'] button")].find(
        (b) => b.textContent?.trim() === label,
      ) as HTMLButtonElement | undefined
      btn?.click()
    }

    // [尺寸, 期望列数, 期望行数]
    const cases: [string, number, number][] = [
      ["S", 1, 1],
      ["M", 2, 1],
      ["L", 2, 2],
      ["XL", 4, 2],
    ]

    // jsdom 不展开 repeat()，保留字面量 "repeat(N, 76px)"，直接读 N。
    const repeatCount = (value: string) => Number(value.match(/repeat\((\d+),/)?.[1] ?? 0)

    for (const [label, cols, rows] of cases) {
      clickSize(label)
      const tplCols = stage.style.getPropertyValue("grid-template-columns")
      const tplRows = stage.style.getPropertyValue("grid-template-rows")
      expect(repeatCount(tplCols), `${label} 舞台列数`).toBe(cols)
      expect(repeatCount(tplRows), `${label} 舞台行数`).toBe(rows)

      const card = stage.querySelector("[data-workbench-grid-item]") as HTMLElement
      expect(card.getAttribute("data-widget-size"), `${label} 卡片尺寸`).toBe(label)
      expect(card.style.getPropertyValue("--widget-col-span"), `${label} 卡片列 span`).toBe(
        `${cols}`,
      )
      expect(card.style.getPropertyValue("--widget-row-span"), `${label} 卡片行 span`).toBe(
        `${rows}`,
      )
    }
    dispose()
  })
})
