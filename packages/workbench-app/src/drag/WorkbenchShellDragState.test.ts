import type { PluginInstance } from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"

import {
  createWorkbenchDndKitDragHandlers,
  type WorkbenchDndDragState,
} from "./WorkbenchShellDragState"

const baseDate = "2026-06-07T00:00:00.000Z"

function instance(overrides: Partial<PluginInstance> = {}): PluginInstance {
  return {
    id: "widget-a",
    workspaceId: "workspace-1",
    pluginId: "plugin.widgets",
    contributionId: "widget.notes",
    extensionPoint: "widget",
    regionId: "mainGrid",
    enabled: true,
    size: "M",
    grid: { x: 0, y: 0, colSpan: 2, rowSpan: 1 },
    config: {},
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  }
}

function dragEvent(sourceId: string, targetId?: string, canceled = false) {
  return {
    canceled,
    operation: {
      source: { id: sourceId },
      target: targetId ? { id: targetId } : null,
    },
  }
}

describe("createWorkbenchDndKitDragHandlers", () => {
  it("persists the existing Tabora order model from dnd-kit drag end events", async () => {
    const targetElement = document.createElement("div")
    targetElement.dataset.widgetInstanceId = "widget-b"
    vi.spyOn(document, "elementFromPoint").mockReturnValue(targetElement)
    const persisted = [
      instance({ id: "widget-a", grid: { x: 0, y: 0, colSpan: 2, rowSpan: 1 } }),
      instance({ id: "widget-b", grid: { x: 1, y: 0, colSpan: 2, rowSpan: 1 } }),
    ]
    const persistGridOrder = vi.fn(async (_instances: PluginInstance[]) => {})
    const showToast = vi.fn()
    let dragState: WorkbenchDndDragState | null = null
    const handlers = createWorkbenchDndKitDragHandlers({
      getPersistedInstances: () => persisted,
      getDragState: () => dragState,
      setDragState: (state) => {
        dragState = state
      },
      persistGridOrder,
      showToast,
    })

    handlers.onDndDragStart(
      dragEvent("widget-a") as unknown as Parameters<typeof handlers.onDndDragStart>[0],
    )
    handlers.onDndDragMove({
      ...dragEvent("widget-a"),
      nativeEvent: new PointerEvent("pointermove", { clientX: 10, clientY: 10 }),
    } as unknown as Parameters<typeof handlers.onDndDragMove>[0])
    expect(handlers.displayedInstances().map((current) => current.id)).toEqual([
      "widget-a",
      "widget-b",
    ])
    expect(dragState).toEqual({ sourceId: "widget-a" })

    handlers.onDndDragEnd(
      dragEvent("widget-a") as unknown as Parameters<typeof handlers.onDndDragEnd>[0],
    )

    await vi.waitFor(() => expect(persistGridOrder).toHaveBeenCalledTimes(1))
    const orderedInstances = persistGridOrder.mock.calls[0]![0]
    expect(orderedInstances.map((current) => current.id)).toEqual(["widget-b", "widget-a"])
    expect(showToast).toHaveBeenCalledWith("排序已更新")
    expect(dragState).toBeNull()
    vi.restoreAllMocks()
  })

  it("keeps hover target outside reactive drag state during sorting", () => {
    const persisted = [
      instance({ id: "widget-a", grid: { x: 0, y: 0, colSpan: 2, rowSpan: 1 } }),
      instance({ id: "widget-b", grid: { x: 1, y: 0, colSpan: 2, rowSpan: 1 } }),
    ]
    let dragState: WorkbenchDndDragState | null = null
    const setDragState = vi.fn((state: WorkbenchDndDragState | null) => {
      dragState = state
    })
    const persistGridOrder = vi.fn(async (_instances: PluginInstance[]) => {})
    const handlers = createWorkbenchDndKitDragHandlers({
      getPersistedInstances: () => persisted,
      getDragState: () => dragState,
      setDragState,
      persistGridOrder,
      showToast: vi.fn(),
    })

    handlers.onDndDragStart(
      dragEvent("widget-a") as unknown as Parameters<typeof handlers.onDndDragStart>[0],
    )
    handlers.onDndDragOver(
      dragEvent("widget-a", "widget-b") as unknown as Parameters<typeof handlers.onDndDragOver>[0],
    )
    handlers.onDndDragOver(
      dragEvent("widget-a", "widget-b") as unknown as Parameters<typeof handlers.onDndDragOver>[0],
    )

    expect(setDragState).toHaveBeenCalledTimes(1)
    expect(dragState).toEqual({ sourceId: "widget-a" })

    handlers.onDndDragEnd(
      dragEvent("widget-a") as unknown as Parameters<typeof handlers.onDndDragEnd>[0],
    )

    expect(persistGridOrder).toHaveBeenCalledTimes(1)
  })

  it("displays persisted instances in grid order instead of raw state order", () => {
    const persisted = [
      instance({ id: "widget-b", grid: { x: 1, y: 0, colSpan: 2, rowSpan: 1 } }),
      instance({ id: "widget-a", grid: { x: 0, y: 0, colSpan: 2, rowSpan: 1 } }),
      instance({
        id: "search-main",
        extensionPoint: "search",
        regionId: "topbar",
      }),
    ]
    const handlers = createWorkbenchDndKitDragHandlers({
      getPersistedInstances: () => persisted,
      getDragState: () => null,
      setDragState: vi.fn(),
      persistGridOrder: vi.fn(async (_instances: PluginInstance[]) => {}),
      showToast: vi.fn(),
    })

    expect(handlers.displayedInstances().map((current) => current.id)).toEqual([
      "widget-a",
      "widget-b",
      "search-main",
    ])
  })

  it("falls back to rendered DOM order when dnd-kit ends without a target", async () => {
    const root = document.createElement("div")
    root.innerHTML = `
      <div data-workbench-grid-item data-widget-instance-id="widget-b"></div>
      <div data-workbench-grid-item data-widget-instance-id="widget-a"></div>
    `
    document.body.append(root)
    const persisted = [
      instance({ id: "widget-a", grid: { x: 0, y: 0, colSpan: 2, rowSpan: 1 } }),
      instance({ id: "widget-b", grid: { x: 1, y: 0, colSpan: 2, rowSpan: 1 } }),
    ]
    const persistGridOrder = vi.fn(async (_instances: PluginInstance[]) => {})
    let dragState: WorkbenchDndDragState | null = null
    const handlers = createWorkbenchDndKitDragHandlers({
      getPersistedInstances: () => persisted,
      getDragState: () => dragState,
      setDragState: (state) => {
        dragState = state
      },
      persistGridOrder,
      showToast: vi.fn(),
    })

    // 目标解析不出来（模拟 dnd-kit 没给 target），但指针确实移动过 —— 这才是真拖拽。
    vi.spyOn(document, "elementFromPoint").mockReturnValue(null)

    handlers.onDndDragStart(
      dragEvent("widget-a") as unknown as Parameters<typeof handlers.onDndDragStart>[0],
    )
    document.dispatchEvent(new PointerEvent("pointermove", { clientX: 10, clientY: 10 }))
    document.dispatchEvent(new PointerEvent("pointermove", { clientX: 90, clientY: 90 }))
    handlers.onDndDragEnd(
      dragEvent("widget-a") as unknown as Parameters<typeof handlers.onDndDragEnd>[0],
    )

    await vi.waitFor(() => expect(persistGridOrder).toHaveBeenCalledTimes(1))
    expect(persistGridOrder.mock.calls[0]![0].map((current) => current.id)).toEqual([
      "widget-b",
      "widget-a",
    ])
    root.remove()
    vi.restoreAllMocks()
  })

  // 回归：单击（pointerdown/up 无位移）不得被当成排序。
  // dnd-kit 的 PointerSensor 在「鼠标 + 目标落在 source.handle 内」时返回零激活约束，
  // 而 WidgetCardShell 把整张卡片同时绑成 root 和 handle，所以单击也会激活拖拽并走到
  // finishDndDrag；若此时读 DOM 顺序落库，单击就会把卡片换位。
  it("does not persist a reorder when the pointer never moved", async () => {
    const root = document.createElement("div")
    root.innerHTML = `
      <div data-workbench-grid-item data-widget-instance-id="widget-b"></div>
      <div data-workbench-grid-item data-widget-instance-id="widget-a"></div>
    `
    document.body.append(root)
    vi.spyOn(document, "elementFromPoint").mockReturnValue(null)
    const persisted = [
      instance({ id: "widget-a", grid: { x: 0, y: 0, colSpan: 2, rowSpan: 1 } }),
      instance({ id: "widget-b", grid: { x: 1, y: 0, colSpan: 2, rowSpan: 1 } }),
    ]
    const persistGridOrder = vi.fn(async (_instances: PluginInstance[]) => {})
    const showToast = vi.fn()
    let dragState: WorkbenchDndDragState | null = null
    const handlers = createWorkbenchDndKitDragHandlers({
      getPersistedInstances: () => persisted,
      getDragState: () => dragState,
      setDragState: (state) => {
        dragState = state
      },
      persistGridOrder,
      showToast,
    })

    handlers.onDndDragStart(
      dragEvent("widget-a") as unknown as Parameters<typeof handlers.onDndDragStart>[0],
    )
    // 纯点击：抬起点与按下点同一位置，没有中间位移。
    document.dispatchEvent(new PointerEvent("pointerup", { clientX: 40, clientY: 40 }))

    // 兜底走 setTimeout(…, 0)，等一个宏任务确认它确实没落库。
    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(persistGridOrder).not.toHaveBeenCalled()
    expect(showToast).not.toHaveBeenCalled()
    expect(dragState).toBeNull()
    root.remove()
    vi.restoreAllMocks()
  })

  // 抖动保护：按下时 1~2px 漂移仍算点击。
  it("treats sub-threshold pointer jitter as a click, not a drag", async () => {
    const root = document.createElement("div")
    root.innerHTML = `
      <div data-workbench-grid-item data-widget-instance-id="widget-b"></div>
      <div data-workbench-grid-item data-widget-instance-id="widget-a"></div>
    `
    document.body.append(root)
    vi.spyOn(document, "elementFromPoint").mockReturnValue(null)
    const persisted = [
      instance({ id: "widget-a", grid: { x: 0, y: 0, colSpan: 2, rowSpan: 1 } }),
      instance({ id: "widget-b", grid: { x: 1, y: 0, colSpan: 2, rowSpan: 1 } }),
    ]
    const persistGridOrder = vi.fn(async (_instances: PluginInstance[]) => {})
    let dragState: WorkbenchDndDragState | null = null
    const handlers = createWorkbenchDndKitDragHandlers({
      getPersistedInstances: () => persisted,
      getDragState: () => dragState,
      setDragState: (state) => {
        dragState = state
      },
      persistGridOrder,
      showToast: vi.fn(),
    })

    handlers.onDndDragStart(
      dragEvent("widget-a") as unknown as Parameters<typeof handlers.onDndDragStart>[0],
    )
    document.dispatchEvent(new PointerEvent("pointermove", { clientX: 40, clientY: 40 }))
    document.dispatchEvent(new PointerEvent("pointermove", { clientX: 42, clientY: 41 }))
    document.dispatchEvent(new PointerEvent("pointerup", { clientX: 42, clientY: 41 }))

    await new Promise((resolve) => setTimeout(resolve, 20))
    expect(persistGridOrder).not.toHaveBeenCalled()
    root.remove()
    vi.restoreAllMocks()
  })

  it("falls back to document pointerup cleanup when dnd-kit misses drag end", async () => {
    const targetElement = document.createElement("div")
    targetElement.dataset.widgetInstanceId = "widget-b"
    vi.spyOn(document, "elementFromPoint").mockReturnValue(targetElement)
    const persisted = [
      instance({ id: "widget-a", grid: { x: 0, y: 0, colSpan: 2, rowSpan: 1 } }),
      instance({ id: "widget-b", grid: { x: 1, y: 0, colSpan: 2, rowSpan: 1 } }),
    ]
    const persistGridOrder = vi.fn(async (_instances: PluginInstance[]) => {})
    let dragState: WorkbenchDndDragState | null = null
    const handlers = createWorkbenchDndKitDragHandlers({
      getPersistedInstances: () => persisted,
      getDragState: () => dragState,
      setDragState: (state) => {
        dragState = state
      },
      persistGridOrder,
      showToast: vi.fn(),
    })

    handlers.onDndDragStart(
      dragEvent("widget-a") as unknown as Parameters<typeof handlers.onDndDragStart>[0],
    )
    expect(document.body.classList.contains("drag-active")).toBe(true)

    document.dispatchEvent(new PointerEvent("pointerup", { clientX: 10, clientY: 10 }))
    handlers.onDndDragEnd(
      dragEvent("widget-a", "widget-b") as unknown as Parameters<typeof handlers.onDndDragEnd>[0],
    )

    await vi.waitFor(() => expect(persistGridOrder).toHaveBeenCalledTimes(1))
    expect(document.body.classList.contains("drag-active")).toBe(false)
    expect(dragState).toBeNull()
    vi.restoreAllMocks()
  })
})
