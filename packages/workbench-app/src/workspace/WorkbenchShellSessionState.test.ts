import type { PluginInstance } from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"

import { hydrateWorkbenchSessionState } from "./WorkbenchShellSessionState"
import type { WorkspaceSessionState } from "./workspaceSession"

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
    createdAt: "2026-06-07T00:00:00.000Z",
    updatedAt: "2026-06-07T00:00:00.000Z",
    ...overrides,
  }
}

function sessionState(overrides: Partial<WorkspaceSessionState> = {}): WorkspaceSessionState {
  return {
    workspace: {
      id: "workspace-1",
      name: "Default",
      activeLayoutId: "official.layout.workbench-dashboard",
      activeThemeId: "official.theme.light",
      activeBackgroundProviderId: "official.background.default",
      regions: {},
      createdAt: "2026-06-07T00:00:00.000Z",
      updatedAt: "2026-06-07T00:00:00.000Z",
    },
    instances: [instance()],
    searchHistory: [
      {
        query: "tabora",
        providerId: "official.google",
        timestamp: "2026-06-07T00:00:00.000Z",
      },
    ],
    searchSettings: {
      defaultProviderId: "official.google",
      enabledProviderIds: ["official.google"],
    },
    locale: null,
    activeLayoutId: "official.layout.workbench-dashboard",
    activeThemeId: "official.theme.light",
    activeBackgroundId: "official.background.default",
    ...overrides,
  }
}

describe("hydrateWorkbenchSessionState", () => {
  it("applies the session state to shell signals and reconciles instances", async () => {
    const session = sessionState({
      activeThemeId: "official.theme.dark",
      activeBackgroundId: "official.background.dark",
    })
    const setWorkspaceState = vi.fn()
    const setLocale = vi.fn()
    const setActiveLayoutId = vi.fn()
    const setSearchSettings = vi.fn()
    const setSearchHistory = vi.fn()
    const setInstances = vi.fn()
    const applyThemeSelection = vi.fn()
    const applyBackgroundSelection = vi.fn()
    const reconcileInstancesForLayout = vi.fn(async () => ({
      instances: [instance({ id: "widget-2" })],
      plan: null,
    }))

    await hydrateWorkbenchSessionState({
      session,
      setWorkspaceState,
      setLocale,
      setActiveLayoutId,
      setSearchSettings,
      setSearchHistory,
      setInstances,
      applyThemeSelection,
      applyBackgroundSelection,
      reconcileInstancesForLayout,
    })

    expect(setWorkspaceState).toHaveBeenCalledWith(session.workspace)
    expect(setActiveLayoutId).toHaveBeenCalledWith("official.layout.workbench-dashboard")
    expect(applyThemeSelection).toHaveBeenCalledWith("official.theme.dark")
    expect(applyBackgroundSelection).toHaveBeenCalledWith("official.background.dark")
    expect(setSearchSettings).toHaveBeenCalledWith(session.searchSettings)
    expect(setSearchHistory).toHaveBeenCalledWith(session.searchHistory)
    expect(reconcileInstancesForLayout).toHaveBeenCalledWith(
      "official.layout.workbench-dashboard",
      session.instances,
    )
    expect(setInstances).toHaveBeenCalledWith([expect.objectContaining({ id: "widget-2" })])
  })
})
