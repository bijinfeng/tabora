import type { PluginInstance } from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"

import {
  focusWorkbenchWidgetInstance,
  persistWorkbenchGridOrder,
  runWorkbenchRailAction,
} from "./WorkbenchShellHostActions"

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
    createdAt: "2026-06-06T00:00:00.000Z",
    updatedAt: "2026-06-06T00:00:00.000Z",
    ...overrides,
  }
}

describe("focusWorkbenchWidgetInstance", () => {
  it("focuses the matching widget card and reports whether focus succeeded", () => {
    const card = document.createElement("button")
    card.dataset.widgetInstanceId = "widget-1"
    const scrollIntoView = vi.fn()
    card.scrollIntoView = scrollIntoView
    document.body.append(card)

    expect(focusWorkbenchWidgetInstance("widget-1")).toBe(true)
    expect(document.activeElement).toBe(card)
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" })
    expect(focusWorkbenchWidgetInstance("missing")).toBe(false)
  })
})

describe("persistWorkbenchGridOrder", () => {
  it("saves each ordered instance and merges the latest records back into the current list", async () => {
    const currentInstances = [
      instance({ id: "widget-1", updatedAt: "2026-06-06T00:00:00.000Z" }),
      instance({
        id: "widget-2",
        contributionId: "widget.todo",
        updatedAt: "2026-06-06T00:00:00.000Z",
      }),
    ]
    const orderedInstances = [
      {
        ...currentInstances[1]!,
        grid: { x: 0, y: 0, colSpan: 2, rowSpan: 1 },
        updatedAt: "2026-06-06T12:00:00.000Z",
      },
      {
        ...currentInstances[0]!,
        grid: { x: 1, y: 0, colSpan: 2, rowSpan: 1 },
        updatedAt: "2026-06-06T12:00:00.000Z",
      },
    ]
    const saveInstance = vi.fn(async () => {})
    const setInstances = vi.fn()

    await persistWorkbenchGridOrder({
      currentInstances,
      orderedInstances,
      saveInstance,
      setInstances,
    })

    expect(saveInstance).toHaveBeenCalledTimes(2)
    expect(saveInstance).toHaveBeenNthCalledWith(1, orderedInstances[0])
    expect(saveInstance).toHaveBeenNthCalledWith(2, orderedInstances[1])
    expect(setInstances).toHaveBeenCalledWith([
      {
        ...currentInstances[0]!,
        grid: { x: 1, y: 0, colSpan: 2, rowSpan: 1 },
        updatedAt: "2026-06-06T12:00:00.000Z",
      },
      {
        ...currentInstances[1]!,
        grid: { x: 0, y: 0, colSpan: 2, rowSpan: 1 },
        updatedAt: "2026-06-06T12:00:00.000Z",
      },
    ])
  })
})

describe("runWorkbenchRailAction", () => {
  it("routes rail actions to the provided callbacks and only scrolls home on web", () => {
    const onAddWidget = vi.fn()
    const onToggleTheme = vi.fn()
    const onOpenSettings = vi.fn()
    const scrollTo = vi.fn()
    vi.stubGlobal("scrollTo", scrollTo)

    runWorkbenchRailAction("add-widget", {
      platform: "web",
      onAddWidget,
      onToggleTheme,
      onOpenSettings,
    })
    runWorkbenchRailAction("theme", {
      platform: "web",
      onAddWidget,
      onToggleTheme,
      onOpenSettings,
    })
    runWorkbenchRailAction("settings", {
      platform: "web",
      onAddWidget,
      onToggleTheme,
      onOpenSettings,
    })
    runWorkbenchRailAction("home", {
      platform: "web",
      onAddWidget,
      onToggleTheme,
      onOpenSettings,
    })
    runWorkbenchRailAction("home", {
      platform: "extension",
      onAddWidget,
      onToggleTheme,
      onOpenSettings,
    })

    expect(onAddWidget).toHaveBeenCalledOnce()
    expect(onToggleTheme).toHaveBeenCalledOnce()
    expect(onOpenSettings).toHaveBeenCalledOnce()
    expect(scrollTo).toHaveBeenCalledTimes(1)
  })
})
