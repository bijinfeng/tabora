import type { SettingsPanelViewProps, WorkbenchSearchSettings, Workspace } from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"
import type { SettingsPanelDescriptor } from "@tabora/workbench-shell"

import { buildWorkbenchSettingsPanelProps, openWorkbenchSettings } from "./WorkbenchShellSettings"

function workspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: "workspace-1",
    name: "Main",
    activeLayoutId: "official.layout.workbench-dashboard",
    activeThemeId: "official.theme.light",
    activeBackgroundProviderId: "official.background.default",
    config: {},
    regions: {},
    createdAt: "2026-06-06T00:00:00.000Z",
    updatedAt: "2026-06-06T00:00:00.000Z",
    ...overrides,
  }
}

function panel(overrides: Partial<SettingsPanelDescriptor> = {}): SettingsPanelDescriptor {
  return {
    id: "official.settings.workspace.appearance",
    title: "Appearance",
    view: "official.settings.workspace.appearance.view",
    section: "appearance",
    order: 10,
    pluginId: "official.settings",
    scope: "workspace",
    ...overrides,
  }
}

function settingsHost(): SettingsPanelViewProps["host"] {
  return {
    close: vi.fn(),
    setDirty: vi.fn(),
    switchTheme: vi.fn(async () => {}),
    switchBackground: vi.fn(async () => {}),
    setDefaultSearchProvider: vi.fn(async () => {}),
    switchLayout: vi.fn(async () => {}),
    setSearchProviderEnabled: vi.fn(async () => {}),
    togglePluginEnabled: vi.fn(async () => {}),
    exportWorkspace: vi.fn(async () => ""),
    importWorkspace: vi.fn(async () => ({ warnings: [] })),
    createWorkspace: vi.fn(async () => {}),
    switchWorkspace: vi.fn(async () => {}),
    deleteWorkspace: vi.fn(async () => {}),
  }
}

describe("openWorkbenchSettings", () => {
  it("resolves the requested section and opens the settings host", () => {
    const setActiveSettingsSectionId = vi.fn()
    const setSettingsOpen = vi.fn()

    openWorkbenchSettings(
      {
        panels: [
          panel({ id: "official.settings.workspace.general", section: "general" }),
          panel({ id: "official.settings.workspace.search", section: "search" }),
        ],
        setActiveSettingsSectionId,
        setSettingsOpen,
      },
      "official.settings.workspace.search",
    )

    expect(setActiveSettingsSectionId).toHaveBeenCalledWith("search")
    expect(setSettingsOpen).toHaveBeenCalledWith(true)
  })
})

describe("buildWorkbenchSettingsPanelProps", () => {
  it("throws when the workspace has not been loaded yet", () => {
    expect(() =>
      buildWorkbenchSettingsPanelProps(panel(), {
        workspace: null,
        workspaces: [],
        layouts: [],
        themes: [],
        backgrounds: [],
        searchProviders: [],
        searchSettings: { defaultProviderId: "" },
        plugins: [],
        host: settingsHost(),
      }),
    ).toThrow("Workspace is not ready")
  })

  it("builds the settings panel props from the provided workspace state", () => {
    const searchSettings: WorkbenchSearchSettings = {
      defaultProviderId: "official.search.google",
      enabledProviderIds: ["official.search.google"],
    }
    const plugins: SettingsPanelViewProps["plugins"] = [
      {
        id: "official.settings",
        name: "Settings",
        version: "1.0.0",
        enabled: true,
        permissions: [],
        contributes: {},
      },
    ]
    const host = settingsHost()
    const currentWorkspace = workspace()
    const workspaces = [currentWorkspace, workspace({ id: "workspace-2", name: "Second" })]

    const result = buildWorkbenchSettingsPanelProps(panel(), {
      workspace: currentWorkspace,
      workspaces,
      layouts: [],
      themes: [],
      backgrounds: [],
      searchProviders: [],
      searchSettings,
      plugins,
      host,
    })

    expect(result).toMatchObject({
      panelId: "official.settings.workspace.appearance",
      pluginId: "official.settings",
      scope: "workspace",
      workspace: currentWorkspace,
      workspaces,
      searchSettings,
      plugins,
    })
    expect(result.host).toBe(host)
  })
})
