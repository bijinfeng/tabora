import { describe, expect, it } from "vitest"
import type { LayoutContribution, PluginInstance, Workspace } from "@tabora/plugin-api"

import { canPluginOpenExternal, createLayoutSwitchExecution } from "./shellController"

const baseDate = "2026-06-06T00:00:00.000Z"

function workspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: "workspace-1",
    name: "Main",
    activeLayoutId: "layout.previous",
    activeThemeId: "theme.light",
    activeBackgroundProviderId: "background.gradient-green",
    config: {},
    regions: {
      old: { regionId: "old", accepts: ["widget"], instances: [{ instanceId: "widget-1" }] },
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
    regionId: "old",
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

describe("canPluginOpenExternal", () => {
  const plugins = [
    {
      manifest: {
        id: "trusted.widget",
        permissions: [{ type: "external-open" as const, hosts: ["example.com"] }],
      },
    },
    {
      manifest: {
        id: "wildcard.widget",
        permissions: [{ type: "external-open" as const, hosts: ["*"] }],
      },
    },
    {
      manifest: {
        id: "plain.widget",
      },
    },
  ]

  it("rejects invalid URLs", () => {
    expect(canPluginOpenExternal({ pluginId: "trusted.widget", url: "not a url", plugins })).toBe(
      false,
    )
  })

  it("rejects missing plugins and plugins without matching external-open permission", () => {
    expect(
      canPluginOpenExternal({
        pluginId: "missing.widget",
        url: "https://example.com",
        plugins,
      }),
    ).toBe(false)
    expect(
      canPluginOpenExternal({
        pluginId: "plain.widget",
        url: "https://example.com",
        plugins,
      }),
    ).toBe(false)
    expect(
      canPluginOpenExternal({
        pluginId: "trusted.widget",
        url: "https://github.com",
        plugins,
      }),
    ).toBe(false)
  })

  it("allows exact host and wildcard external-open permissions", () => {
    expect(
      canPluginOpenExternal({
        pluginId: "trusted.widget",
        url: "https://example.com/docs",
        plugins,
      }),
    ).toBe(true)
    expect(
      canPluginOpenExternal({
        pluginId: "wildcard.widget",
        url: "https://github.com/tabora",
        plugins,
      }),
    ).toBe(true)
  })
})

describe("createLayoutSwitchExecution", () => {
  it("preserves a pre-switch snapshot while migrating instances to the new layout", () => {
    const currentWorkspace = workspace()
    const currentInstance = instance()

    const result = createLayoutSwitchExecution({
      workspace: currentWorkspace,
      instances: [currentInstance],
      targetLayout: layout([{ id: "grid", title: "Grid", accepts: ["widget"] }]),
      now: "2026-06-06T12:00:00.000Z",
    })

    expect(result.plan.snapshot).toEqual({
      id: "workspace-1:snapshot:layout.previous:layout.next",
      workspaceId: "workspace-1",
      layoutId: "layout.previous",
      regions: currentWorkspace.regions,
      instances: [currentInstance],
      createdAt: baseDate,
    })
    expect(result.instances).toEqual([
      {
        ...currentInstance,
        regionId: "grid",
        updatedAt: "2026-06-06T12:00:00.000Z",
      },
    ])
  })

  it("moves incompatible instances into the unplaced region without mutating the snapshot", () => {
    const themeInstance = instance({
      id: "theme-1",
      pluginId: "plugin.theme",
      contributionId: "theme.default",
      extensionPoint: "theme",
      regionId: "themeRegion",
    })

    const result = createLayoutSwitchExecution({
      workspace: workspace({
        regions: {
          themeRegion: {
            regionId: "themeRegion",
            accepts: ["theme"],
            instances: [{ instanceId: "theme-1" }],
          },
        },
      }),
      instances: [themeInstance],
      targetLayout: layout([{ id: "grid", title: "Grid", accepts: ["widget"] }]),
      now: "2026-06-06T12:00:00.000Z",
    })

    expect(result.plan.snapshot.instances).toEqual([themeInstance])
    expect(result.instances).toEqual([
      {
        ...themeInstance,
        regionId: "unplaced",
        updatedAt: "2026-06-06T12:00:00.000Z",
      },
    ])
  })
})
