import type { PluginInstance } from "@tabora/plugin-api"
import { describe, expect, it } from "vitest"

import {
  beginWorkbenchDragController,
  completeWorkbenchDragController,
  updateWorkbenchDragController,
} from "./WorkbenchDragController"

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

describe("WorkbenchDragController", () => {
  it("does not activate dragging before crossing the 5px threshold", () => {
    const state = beginWorkbenchDragController({
      pointerId: 1,
      sourceId: "widget-a",
      point: { x: 10, y: 10 },
      instances: [instance()],
    })

    const next = updateWorkbenchDragController({
      state,
      point: { x: 13, y: 13 },
      overId: "widget-a",
    })

    expect(next.phase).toBe("pending")
    expect(next.previewInstances.map((current) => current.id)).toEqual(["widget-a"])
  })

  it("activates drag after crossing threshold and immediately swaps over the hovered target", () => {
    const first = instance({ id: "widget-a", grid: { x: 0, y: 0, colSpan: 2, rowSpan: 1 } })
    const second = instance({ id: "widget-b", grid: { x: 1, y: 0, colSpan: 2, rowSpan: 1 } })

    const state = beginWorkbenchDragController({
      pointerId: 1,
      sourceId: "widget-a",
      point: { x: 10, y: 10 },
      instances: [first, second],
    })

    const next = updateWorkbenchDragController({
      state,
      point: { x: 20, y: 20 },
      overId: "widget-b",
    })

    expect(next.phase).toBe("dragging")
    expect(next.previewInstances.map((current) => current.id)).toEqual(["widget-b", "widget-a"])
  })

  it("does not reshuffle repeatedly while staying over the same target", () => {
    const first = instance({ id: "widget-a", grid: { x: 0, y: 0, colSpan: 2, rowSpan: 1 } })
    const second = instance({ id: "widget-b", grid: { x: 1, y: 0, colSpan: 2, rowSpan: 1 } })

    const state = updateWorkbenchDragController({
      state: beginWorkbenchDragController({
        pointerId: 1,
        sourceId: "widget-a",
        point: { x: 10, y: 10 },
        instances: [first, second],
      }),
      point: { x: 20, y: 20 },
      overId: "widget-b",
    })

    const next = updateWorkbenchDragController({
      state,
      point: { x: 24, y: 24 },
      overId: "widget-b",
    })

    expect(next.previewInstances.map((current) => current.id)).toEqual(["widget-b", "widget-a"])
  })

  it("commits preview instances on pointer release only when order changed", () => {
    const first = instance({ id: "widget-a", grid: { x: 0, y: 0, colSpan: 2, rowSpan: 1 } })
    const second = instance({ id: "widget-b", grid: { x: 1, y: 0, colSpan: 2, rowSpan: 1 } })

    const state = updateWorkbenchDragController({
      state: beginWorkbenchDragController({
        pointerId: 1,
        sourceId: "widget-a",
        point: { x: 10, y: 10 },
        instances: [first, second],
      }),
      point: { x: 20, y: 20 },
      overId: "widget-b",
    })

    const completed = completeWorkbenchDragController(state)

    expect(completed.changed).toBe(true)
    expect(completed.instances?.map((current) => current.id)).toEqual(["widget-b", "widget-a"])
  })

  it("cancels cleanly when the pointer never causes a reorder", () => {
    const state = beginWorkbenchDragController({
      pointerId: 1,
      sourceId: "widget-a",
      point: { x: 10, y: 10 },
      instances: [instance()],
    })

    const completed = completeWorkbenchDragController(
      updateWorkbenchDragController({
        state,
        point: { x: 20, y: 20 },
        overId: "widget-a",
      }),
    )

    expect(completed.changed).toBe(false)
    expect(completed.instances).toBeNull()
  })
})
