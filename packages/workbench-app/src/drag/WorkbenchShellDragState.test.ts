import type { PluginInstance } from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"

import { createWorkbenchPointerDragHandlers } from "./WorkbenchShellDragState"
import type { WorkbenchDragControllerState } from "./WorkbenchDragController"

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

describe("createWorkbenchPointerDragHandlers dnd-kit bridge", () => {
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
    let dragState: WorkbenchDragControllerState | null = null
    const handlers = createWorkbenchPointerDragHandlers({
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
    handlers.onDndDragEnd(
      dragEvent("widget-a") as unknown as Parameters<typeof handlers.onDndDragEnd>[0],
    )

    await vi.waitFor(() => expect(persistGridOrder).toHaveBeenCalledTimes(1))
    const orderedInstances = persistGridOrder.mock.calls[0]![0]
    expect(orderedInstances.map((current) => current.id)).toEqual(["widget-b", "widget-a"])
    expect(showToast).toHaveBeenCalledWith("排序已更新")
    expect(dragState).toBeNull()
  })
})
