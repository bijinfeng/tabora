import { describe, expect, test } from "vitest"
import type { LayoutContribution, PluginInstance, Workspace } from "@tabora/plugin-api"

import { createLayoutSwitchPlan } from "./layout-switcher"

const baseDate = "2026-06-05T00:00:00.000Z"

function workspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: "workspace-1",
    name: "Main",
    activeLayoutId: "layout.previous",
    activeThemeId: "theme.light",
    regions: {
      search: { regionId: "search", accepts: ["search"], instances: [{ instanceId: "search-1" }] },
      grid: { regionId: "grid", accepts: ["widget"], instances: [{ instanceId: "widget-1" }] },
    },
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  }
}

function instance(overrides: Partial<PluginInstance> = {}): PluginInstance {
  return {
    id: "widget-1",
    workspaceId: "workspace-1",
    pluginId: "plugin.widgets",
    contributionId: "widget.notes",
    extensionPoint: "widget",
    regionId: "grid",
    enabled: true,
    size: "M",
    config: {},
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  }
}

function layout(regions: LayoutContribution["regions"]): LayoutContribution {
  return {
    id: "layout.next",
    title: "Next",
    regions,
    defaultRegions: {},
    supportsResponsive: true,
  }
}

describe("createLayoutSwitchPlan", () => {
  test("same region id is preserved", () => {
    const currentInstance = instance({ id: "widget-1", regionId: "grid" })

    const plan = createLayoutSwitchPlan({
      workspace: workspace(),
      instances: [currentInstance],
      targetLayout: layout([{ id: "grid", title: "Grid", accepts: ["widget"] }]),
    })

    expect(plan.migratedInstances).toEqual([currentInstance])
    expect(plan.nextRegions).toEqual({
      grid: { regionId: "grid", accepts: ["widget"], instances: [{ instanceId: "widget-1" }] },
    })
  })

  test("widget migrates to first compatible widget region", () => {
    const plan = createLayoutSwitchPlan({
      workspace: workspace(),
      instances: [instance({ regionId: "oldGrid" })],
      targetLayout: layout([
        { id: "search", title: "Search", accepts: ["search"] },
        { id: "primary", title: "Primary", accepts: ["widget"] },
        { id: "secondary", title: "Secondary", accepts: ["widget"] },
      ]),
    })

    expect(plan.migratedInstances[0]?.regionId).toBe("primary")
    expect(plan.nextRegions.primary?.instances).toEqual([{ instanceId: "widget-1" }])
    expect(plan.nextRegions.secondary?.instances).toEqual([])
  })

  test("search does not migrate into widget region", () => {
    const searchInstance = instance({
      id: "search-1",
      pluginId: "plugin.search",
      contributionId: "search.command",
      extensionPoint: "search",
      regionId: "oldSearch",
    })

    const plan = createLayoutSwitchPlan({
      workspace: workspace(),
      instances: [searchInstance],
      targetLayout: layout([{ id: "grid", title: "Grid", accepts: ["widget"] }]),
    })

    expect(plan.migratedInstances).toEqual([])
    expect(plan.unplacedInstances).toEqual([searchInstance])
    expect(plan.nextRegions.grid?.instances).toEqual([])
  })

  test("incompatible instance is returned as unplaced without deletion", () => {
    const themeInstance = instance({
      id: "theme-1",
      pluginId: "plugin.theme",
      contributionId: "theme.default",
      extensionPoint: "theme",
      regionId: "themeRegion",
    })

    const plan = createLayoutSwitchPlan({
      workspace: workspace(),
      instances: [themeInstance],
      targetLayout: layout([{ id: "grid", title: "Grid", accepts: ["widget"] }]),
    })

    expect(plan.migratedInstances).toEqual([])
    expect(plan.unplacedInstances).toEqual([themeInstance])
    expect(plan.unplacedInstances[0]?.regionId).toBe("themeRegion")
    expect(plan.nextRegions.grid?.instances).toEqual([])
  })

  test("snapshot captures previous regions and instances", () => {
    const currentWorkspace = workspace({
      activeLayoutId: "layout.previous",
      regions: {
        old: { regionId: "old", accepts: ["widget"], instances: [{ instanceId: "widget-1" }] },
      },
    })
    const currentInstance = instance({ regionId: "old" })

    const plan = createLayoutSwitchPlan({
      workspace: currentWorkspace,
      instances: [currentInstance],
      targetLayout: layout([{ id: "grid", title: "Grid", accepts: ["widget"] }]),
    })

    expect(plan.snapshot).toEqual({
      layoutId: "layout.previous",
      regions: currentWorkspace.regions,
      instances: [currentInstance],
    })
  })
})
