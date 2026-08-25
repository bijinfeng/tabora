import type {
  PluginPermission,
  SettingsPanelData,
  SettingsPanelViewProps,
  WorkbenchSearchSettings,
  Workspace,
} from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"
import type { SettingsPanelDescriptor } from "@tabora/workbench-shell"

import { buildWorkbenchSettingsPanelProps, openWorkbenchSettings } from "./WorkbenchShellSettings"

const refs = {
  layout: (id: string) => ({ pluginId: "official.layout", kind: "layout" as const, id }),
  theme: (id: string) => ({ pluginId: "official.theme", kind: "theme" as const, id }),
  background: (id: string) => ({
    pluginId: "official.background",
    kind: "background-provider" as const,
    id,
  }),
  provider: (id: string) => ({ pluginId: "official.search", kind: "search-provider" as const, id }),
}

function workspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: "workspace-1",
    name: "Main",
    activeLayout: refs.layout("official.layout.workbench-dashboard"),
    activeTheme: refs.theme("official.theme.light"),
    activeBackgroundProvider: refs.background("official.background.default"),
    config: {},
    createdAt: "2026-06-06T00:00:00.000Z",
    updatedAt: "2026-06-06T00:00:00.000Z",
    ...overrides,
  }
}

function panel(overrides: Partial<SettingsPanelDescriptor> = {}): SettingsPanelDescriptor {
  return {
    id: "official.settings.workspace.appearance",
    title: "Appearance",
    content: {
      kind: "custom-view",
      view: "official.settings.workspace.appearance.view",
    },
    section: "appearance",
    order: 10,
    pluginId: "official.settings.workspace",
    scope: "workspace",
    hostActions: ["workspace.theme.write"],
    grantedHostActions: ["workspace.theme.write"],
    hostReads: ["workspace.current.read"],
    grantedHostReads: ["workspace.current.read"],
    surfaces: ["desktop", "mobile"],
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
    setSearchProviderEnabled: vi.fn(async () => {}),
    togglePluginEnabled: vi.fn(async () => {}),
    revokePluginPermission: vi.fn(async () => {}),
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
        surface: "desktop",
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
  it("only exposes an instance id to an instance-scoped panel with an explicit target", () => {
    const options = {
      workspace: workspace(),
      workspaces: [],
      themes: [],
      backgrounds: [],
      searchProviders: [],
      searchSettings: {
        defaultProvider: refs.provider("official.search.google"),
        enabledProviders: [refs.provider("official.search.google")],
      },
      plugins: [],
      locale: "zh-CN" as const,
      availableLocales: [],
      host: settingsHost(),
      surface: "desktop" as const,
    }
    const instancePanel = panel({ scope: "instance" })

    expect(buildWorkbenchSettingsPanelProps(instancePanel, options).instanceId).toBeUndefined()
    expect(
      buildWorkbenchSettingsPanelProps(instancePanel, { ...options, instanceId: "weather-1" })
        .instanceId,
    ).toBe("weather-1")
  })

  it("throws when the workspace has not been loaded yet", () => {
    expect(() =>
      buildWorkbenchSettingsPanelProps(panel(), {
        workspace: null,
        workspaces: [],
        themes: [],
        backgrounds: [],
        searchProviders: [],
        searchSettings: {
          defaultProvider: refs.provider("official.search.google"),
          enabledProviders: [refs.provider("official.search.google")],
        },
        plugins: [],
        locale: "zh-CN",
        availableLocales: [],
        host: settingsHost(),
        surface: "desktop",
      }),
    ).toThrow("Workspace is not ready")
  })

  it("builds the settings panel props from the provided workspace state", async () => {
    const searchSettings: WorkbenchSearchSettings = {
      defaultProvider: refs.provider("official.search.google"),
      enabledProviders: [refs.provider("official.search.google")],
    }
    const plugins: NonNullable<SettingsPanelData["plugins"]> = [
      {
        id: "official.settings",
        name: "Settings",
        version: "1.0.0",
        enabled: true,
        permissions: [],
        grantedPermissions: [],
        contributionKinds: [],
      },
    ]
    const switchTheme = vi.fn(async () => {})
    const host = { ...settingsHost(), switchTheme }
    const currentWorkspace = workspace()
    const workspaces = [currentWorkspace, workspace({ id: "workspace-2", name: "Second" })]

    const result = buildWorkbenchSettingsPanelProps(panel(), {
      workspace: currentWorkspace,
      workspaces,
      themes: [],
      backgrounds: [],
      searchProviders: [],
      searchSettings,
      plugins,
      locale: "zh-CN",
      availableLocales: [],
      host,
      surface: "desktop",
    })

    expect(result).toMatchObject({
      panelId: "official.settings.workspace.appearance",
      pluginId: "official.settings.workspace",
      scope: "workspace",
      data: {
        workspace: {
          id: currentWorkspace.id,
          name: currentWorkspace.name,
          activeLayout: currentWorkspace.activeLayout,
          activeTheme: currentWorkspace.activeTheme,
          activeBackgroundProvider: currentWorkspace.activeBackgroundProvider,
          regionCount: 2,
        },
      },
      surface: "desktop",
    })
    expect(
      buildWorkbenchSettingsPanelProps(panel(), {
        workspace: currentWorkspace,
        workspaces,
        themes: [],
        backgrounds: [],
        searchProviders: [],
        searchSettings,
        plugins,
        locale: "zh-CN",
        availableLocales: [],
        host,
        surface: "mobile",
      }).surface,
    ).toBe("mobile")
    expect(result.host).not.toBe(host)
    await result.host.switchTheme?.(refs.theme("official.theme.dark"))
    expect(switchTheme).toHaveBeenCalledWith(refs.theme("official.theme.dark"))
    expect("togglePluginEnabled" in result.host).toBe(false)
  })

  it("does not expose requested workspace controls until the host grants them", async () => {
    const close = vi.fn()
    const host = { ...settingsHost(), close }
    const result = buildWorkbenchSettingsPanelProps(
      panel({
        pluginId: "community.plugin",
        hostActions: ["workspace.theme.write"],
        grantedHostActions: [],
        hostReads: [],
        grantedHostReads: [],
      }),
      {
        workspace: workspace(),
        workspaces: [],
        themes: [],
        backgrounds: [],
        searchProviders: [],
        searchSettings: {
          defaultProvider: refs.provider("official.search.google"),
          enabledProviders: [],
        },
        plugins: [],
        locale: "zh-CN",
        availableLocales: [],
        host,
        surface: "desktop",
      },
    )

    result.host.close()
    expect(close).toHaveBeenCalledOnce()
    expect("switchTheme" in result.host).toBe(false)
    expect("togglePluginEnabled" in result.host).toBe(false)
    expect("revokePluginPermission" in result.host).toBe(false)
    expect(result.data).toEqual({})
  })

  it("exposes permission revocation only to panels granted plugins.manage", async () => {
    const revokePluginPermission = vi.fn(async () => {})
    const host = { ...settingsHost(), revokePluginPermission }
    const context = {
      workspace: workspace(),
      workspaces: [],
      themes: [],
      backgrounds: [],
      searchProviders: [],
      searchSettings: {
        defaultProvider: refs.provider("official.search.google"),
        enabledProviders: [],
      },
      plugins: [],
      locale: "zh-CN" as const,
      availableLocales: [],
      host,
      surface: "desktop" as const,
    }

    const ungranted = buildWorkbenchSettingsPanelProps(
      panel({ hostActions: ["plugins.manage"], grantedHostActions: [] }),
      context,
    )
    expect("revokePluginPermission" in ungranted.host).toBe(false)

    const granted = buildWorkbenchSettingsPanelProps(
      panel({ hostActions: ["plugins.manage"], grantedHostActions: ["plugins.manage"] }),
      context,
    )
    const permission: PluginPermission = { type: "network", hosts: ["api.example.com"] }
    await granted.host.revokePluginPermission?.("plugin.weather", permission)
    expect(revokePluginPermission).toHaveBeenCalledWith("plugin.weather", permission)
  })
})
