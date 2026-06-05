import { describe, expect, test } from "vitest"
import type { PluginInstance } from "@tabora/plugin-api"

import { createDragSortPlan } from "./drag-sort-model"

const baseDate = "2026-06-05T00:00:00.000Z"

function instance(overrides: Partial<PluginInstance> = {}): PluginInstance {
  return {
    id: "widget-a",
    workspaceId: "workspace-1",
    pluginId: "plugin.widgets",
    contributionId: "widget.notes",
    extensionPoint: "widget",
    regionId: "main",
    enabled: true,
    size: "M",
    grid: { x: 0, y: 0, colSpan: 2, rowSpan: 1 },
    config: {},
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  }
}

describe("createDragSortPlan", () => {
  test("moves same-region source before target", () => {
    const source = instance({ id: "source", grid: { x: 2, y: 0, colSpan: 1, rowSpan: 1 } })
    const before = instance({ id: "before", grid: { x: 0, y: 0, colSpan: 2, rowSpan: 1 } })
    const target = instance({ id: "target", grid: { x: 1, y: 0, colSpan: 2, rowSpan: 2 } })

    const plan = createDragSortPlan({
      sourceId: "source",
      targetId: "target",
      instances: [before, target, source],
    })

    expect(plan.changed).toBe(true)
    expect(plan.instances.map((item) => item.id)).toEqual(["before", "source", "target"])
    expect(plan.instances.map((item) => item.grid?.x)).toEqual([0, 1, 2])
  })

  test("keeps legacy drop semantics when dragging earlier item onto later target", () => {
    const source = instance({ id: "source", grid: { x: 0, y: 0, colSpan: 1, rowSpan: 1 } })
    const middle = instance({ id: "middle", grid: { x: 1, y: 0, colSpan: 2, rowSpan: 1 } })
    const target = instance({ id: "target", grid: { x: 2, y: 0, colSpan: 2, rowSpan: 2 } })

    const plan = createDragSortPlan({
      sourceId: "source",
      targetId: "target",
      instances: [source, middle, target],
    })

    expect(plan.changed).toBe(true)
    expect(plan.instances.map((item) => item.id)).toEqual(["middle", "target", "source"])
    expect(plan.instances.map((item) => item.grid?.x)).toEqual([0, 1, 2])
  })

  test("uses row before column for visual ordering", () => {
    const laterRow = instance({ id: "later-row", grid: { x: 0, y: 1, colSpan: 1, rowSpan: 1 } })
    const target = instance({ id: "target", grid: { x: 1, y: 0, colSpan: 2, rowSpan: 1 } })
    const source = instance({ id: "source", grid: { x: 2, y: 0, colSpan: 2, rowSpan: 2 } })

    const plan = createDragSortPlan({
      sourceId: "source",
      targetId: "target",
      instances: [laterRow, target, source],
    })

    expect(plan.changed).toBe(true)
    expect(plan.instances.map((item) => item.id)).toEqual(["later-row", "source", "target"])
    expect(plan.instances.map((item) => item.grid?.x)).toEqual([2, 0, 1])
  })

  test("returns unchanged order for cross-region drag", () => {
    const source = instance({
      id: "source",
      regionId: "main",
      grid: { x: 0, y: 0, colSpan: 1, rowSpan: 1 },
    })
    const target = instance({
      id: "target",
      regionId: "side",
      grid: { x: 0, y: 0, colSpan: 2, rowSpan: 1 },
    })

    const plan = createDragSortPlan({
      sourceId: "source",
      targetId: "target",
      instances: [source, target],
    })

    expect(plan.changed).toBe(false)
    expect(plan.instances).toEqual([source, target])
  })

  test("ignores disabled instances during reorder without dropping their data", () => {
    const source = instance({ id: "source", grid: { x: 2, y: 0, colSpan: 1, rowSpan: 1 } })
    const disabled = instance({
      id: "disabled",
      enabled: false,
      grid: { x: 1, y: 4, colSpan: 2, rowSpan: 2, locked: true },
    })
    const target = instance({ id: "target", grid: { x: 0, y: 0, colSpan: 2, rowSpan: 1 } })

    const plan = createDragSortPlan({
      sourceId: "source",
      targetId: "target",
      instances: [target, disabled, source],
    })

    expect(plan.changed).toBe(true)
    expect(plan.instances.map((item) => item.id)).toEqual(["source", "disabled", "target"])
    expect(plan.instances.find((item) => item.id === "disabled")).toEqual(disabled)
    expect(plan.instances.filter((item) => item.enabled).map((item) => item.grid?.x)).toEqual([
      0, 1,
    ])
  })

  test("updates grid order deterministically while preserving grid shape", () => {
    const first = instance({
      id: "first",
      grid: { x: 0, y: 3, colSpan: 1, rowSpan: 2, locked: true },
    })
    const second = instance({
      id: "second",
      grid: { x: 1, y: 7, colSpan: 2, rowSpan: 1 },
    })
    const third = instance({
      id: "third",
      grid: { x: 2, y: 9, colSpan: 2, rowSpan: 2 },
    })

    const plan = createDragSortPlan({
      sourceId: "third",
      targetId: "first",
      instances: [first, second, third],
    })

    expect(plan.instances.map((item) => ({ id: item.id, grid: item.grid }))).toEqual([
      { id: "third", grid: { x: 0, y: 0, colSpan: 2, rowSpan: 2 } },
      { id: "first", grid: { x: 1, y: 0, colSpan: 1, rowSpan: 2, locked: true } },
      { id: "second", grid: { x: 2, y: 0, colSpan: 2, rowSpan: 1 } },
    ])
  })
})
