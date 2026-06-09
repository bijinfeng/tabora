import type { LayoutRegion, PluginInstance, WidgetContribution } from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"

import {
  addWorkbenchWidget,
  removeWorkbenchWidget,
  resizeWorkbenchWidget,
} from "./WorkbenchShellWidgetState"

const baseDate = "2026-06-07T00:00:00.000Z"

function instance(overrides: Partial<PluginInstance> = {}): PluginInstance {
  return {
    id: "widget-1",
    workspaceId: "workspace-1",
    pluginId: "plugin.widgets",
    contributionId: "widget.notes",
    extensionPoint: "widget",
    regionId: "mainGrid",
    enabled: true,
    size: "M",
    config: {},
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  }
}

function widget(overrides: Partial<WidgetContribution> = {}): WidgetContribution {
  return {
    id: "widget.notes",
    title: "便签",
    supportedSizes: ["S", "M", "L"],
    defaultSize: "M",
    allowMultipleInstances: true,
    views: { card: "widget.notes.card" },
    ...overrides,
  }
}

describe("addWorkbenchWidget", () => {
  it("creates a widget instance in the first widget region, persists it, and updates state", async () => {
    const currentInstances = [instance({ id: "widget-0" })]
    const layoutRegions: LayoutRegion[] = [
      {
        id: "toolbar",
        title: "Toolbar",
        accepts: ["search"],
        required: false,
      },
      { id: "grid", title: "Grid", accepts: ["widget"], required: false },
    ]
    const assignGridOrder = vi.fn((instances: PluginInstance[]) => instances)
    const saveInstance = vi.fn(async () => {})
    const setInstances = vi.fn()

    const result = await addWorkbenchWidget({
      workspaceId: "workspace-1",
      pluginId: "plugin.widgets",
      contributionId: "widget.notes",
      currentInstances,
      layoutRegions,
      resolveWidget: () => widget(),
      assignGridOrder,
      saveInstance,
      setInstances,
      buildInstanceId: () => "widget.notes-1",
      now: () => "2026-06-07T01:00:00.000Z",
    })

    expect(result).toBe(true)
    expect(assignGridOrder).toHaveBeenCalledWith([
      currentInstances[0],
      expect.objectContaining({
        id: "widget.notes-1",
        workspaceId: "workspace-1",
        pluginId: "plugin.widgets",
        contributionId: "widget.notes",
        regionId: "grid",
        size: "M",
      }),
    ])
    expect(saveInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "widget.notes-1",
        regionId: "grid",
      }),
    )
    expect(setInstances).toHaveBeenCalledWith(
      expect.arrayContaining([expect.objectContaining({ id: "widget.notes-1" })]),
    )
  })

  it("does not create or persist a widget instance when the active layout has no widget region", async () => {
    const assignGridOrder = vi.fn((instances: PluginInstance[]) => instances)
    const saveInstance = vi.fn(async () => {})
    const setInstances = vi.fn()

    const result = await addWorkbenchWidget({
      workspaceId: "workspace-1",
      pluginId: "plugin.widgets",
      contributionId: "widget.notes",
      currentInstances: [instance({ id: "widget-0" })],
      layoutRegions: [{ id: "toolbar", title: "Toolbar", accepts: ["search"], required: false }],
      resolveWidget: () => widget(),
      assignGridOrder,
      saveInstance,
      setInstances,
      buildInstanceId: () => "widget.notes-1",
      now: () => "2026-06-07T01:00:00.000Z",
    })

    expect(result).toBe(false)
    expect(assignGridOrder).not.toHaveBeenCalled()
    expect(saveInstance).not.toHaveBeenCalled()
    expect(setInstances).not.toHaveBeenCalled()
  })
})

describe("removeWorkbenchWidget", () => {
  it("clears matching transient state, removes the instance, and updates the list", async () => {
    const removeInstance = vi.fn(async () => {})
    const clearExpand = vi.fn()
    const clearContextMenu = vi.fn()
    const setInstances = vi.fn()

    await removeWorkbenchWidget({
      instanceId: "widget-1",
      currentInstances: [instance(), instance({ id: "widget-2" })],
      currentExpandInstanceId: "widget-1",
      currentContextMenuInstanceId: "widget-1",
      clearExpand,
      clearContextMenu,
      removeInstance,
      setInstances,
    })

    expect(clearExpand).toHaveBeenCalled()
    expect(clearContextMenu).toHaveBeenCalled()
    expect(removeInstance).toHaveBeenCalledWith("widget-1")
    expect(setInstances).toHaveBeenCalledWith([expect.objectContaining({ id: "widget-2" })])
  })
})

describe("resizeWorkbenchWidget", () => {
  it("updates widget size/grid placement, persists it, and updates state", async () => {
    const saveInstance = vi.fn(async () => {})
    const setInstances = vi.fn()

    await resizeWorkbenchWidget({
      instanceId: "widget-1",
      newSize: "L",
      currentInstances: [instance({ size: "M", grid: { x: 0, y: 0, colSpan: 2, rowSpan: 1 } })],
      saveInstance,
      setInstances,
      now: () => "2026-06-07T01:00:00.000Z",
    })

    expect(saveInstance).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "widget-1",
        size: "L",
        grid: expect.objectContaining({ colSpan: 2, rowSpan: 2 }),
        updatedAt: "2026-06-07T01:00:00.000Z",
      }),
    )
    expect(setInstances).toHaveBeenCalledWith([
      expect.objectContaining({
        id: "widget-1",
        size: "L",
      }),
    ])
  })
})
