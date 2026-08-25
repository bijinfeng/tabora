import type {
  BackgroundProviderContribution,
  PluginInstance,
  PluginPermission,
  SearchHistoryEntry,
  ThemeContribution,
  WorkbenchSearchSettings,
  Workspace,
  WorkspacePresetContribution,
} from "@tabora/plugin-api"
import type {
  InstanceRepository,
  PluginDataRepository,
  TaboraDatabase,
  WorkspaceRepository,
} from "@tabora/storage"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => {
  const workspaceStateActions = {
    updateWorkspace: vi.fn(async () => {}),
    exportWorkspace: vi.fn(async () => "workspace-export"),
    importWorkspace: vi.fn(async () => ({ warnings: ["imported"] })),
    createWorkspace: vi.fn(async () => workspace({ id: "workspace-new" })),
    switchWorkspace: vi.fn(async () => {}),
    deleteWorkspace: vi.fn(async () => {}),
  }

  return {
    applyWorkbenchThemeSelection: vi.fn(),
    applyWorkbenchBackgroundSelection: vi.fn(),
    switchWorkbenchTheme: vi.fn(async () => {}),
    switchWorkbenchBackground: vi.fn(async () => {}),
    setWorkbenchDefaultSearchProvider: vi.fn(async () => {}),
    setWorkbenchSearchProviderEnabled: vi.fn(async () => {}),
    saveWorkbenchSearchHistory: vi.fn(async () => {}),
    reconcileWorkbenchLayoutInstances: vi.fn(async () => ({ instances: [], plan: null })),
    switchWorkbenchLayout: vi.fn(async () => {}),
    createLayoutSwitchExecution: vi.fn(() => []),
    createWorkbenchWorkspaceState: vi.fn(() => workspaceStateActions),
    updateWorkspaceRecord: vi.fn(async () =>
      workspace({
        activeLayout: { pluginId: "official.layout", kind: "layout", id: "layout.next" },
      }),
    ),
    updateWorkspaceTheme: vi.fn(async () =>
      workspace({
        activeTheme: { pluginId: "official.theme", kind: "theme", id: "official.theme.dark" },
      }),
    ),
    updateWorkspaceBackground: vi.fn(async () =>
      workspace({
        activeBackgroundProvider: {
          pluginId: "official.background",
          kind: "background-provider",
          id: "official.background.dark",
        },
      }),
    ),
    workspaceStateActions,
  }
})

vi.mock("../appearance/WorkbenchShellAppearanceState", () => ({
  applyWorkbenchThemeSelection: mocks.applyWorkbenchThemeSelection,
  applyWorkbenchBackgroundSelection: mocks.applyWorkbenchBackgroundSelection,
  switchWorkbenchTheme: mocks.switchWorkbenchTheme,
  switchWorkbenchBackground: mocks.switchWorkbenchBackground,
}))

vi.mock("../search/WorkbenchShellSearchState", () => ({
  setWorkbenchDefaultSearchProvider: mocks.setWorkbenchDefaultSearchProvider,
  setWorkbenchSearchProviderEnabled: mocks.setWorkbenchSearchProviderEnabled,
  saveWorkbenchSearchHistory: mocks.saveWorkbenchSearchHistory,
}))

vi.mock("../layout/WorkbenchShellLayoutState", () => ({
  reconcileWorkbenchLayoutInstances: mocks.reconcileWorkbenchLayoutInstances,
  switchWorkbenchLayout: mocks.switchWorkbenchLayout,
}))

vi.mock("../shared/shellController", () => ({
  createLayoutSwitchExecution: mocks.createLayoutSwitchExecution,
}))

vi.mock("./WorkbenchShellWorkspaceState", () => ({
  createWorkbenchWorkspaceState: mocks.createWorkbenchWorkspaceState,
}))

vi.mock("./workspaceSession", () => ({
  updateWorkspaceRecord: mocks.updateWorkspaceRecord,
  updateWorkspaceTheme: mocks.updateWorkspaceTheme,
  updateWorkspaceBackground: mocks.updateWorkspaceBackground,
}))

import { createWorkbenchWorkspaceController } from "./WorkbenchShellWorkspaceController"

const baseDate = "2026-06-07T00:00:00.000Z"
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
    name: "默认工作区",
    activeLayout: refs.layout("official.layout.workbench-dashboard"),
    activeTheme: refs.theme("official.theme.light"),
    activeBackgroundProvider: refs.background("official.background.default"),
    config: {},
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  }
}

function instance(overrides: Partial<PluginInstance> = {}): PluginInstance {
  return {
    id: "widget-1",
    workspaceId: "workspace-1",
    contribution: { pluginId: "plugin.widgets", kind: "widget", id: "widget.notes" },
    regionId: "mainGrid",
    enabled: true,
    size: "M",
    config: {},
    createdAt: baseDate,
    updatedAt: baseDate,
    ...overrides,
  }
}

function searchSettings(overrides: Partial<WorkbenchSearchSettings> = {}): WorkbenchSearchSettings {
  return {
    defaultProvider: refs.provider("official.search.google"),
    enabledProviders: [refs.provider("official.search.google")],
    ...overrides,
  }
}

function defaultWorkspacePreset(): WorkspacePresetContribution {
  return {
    id: "preset.default",
    title: "Default Workspace",
    plugins: ["plugin.widgets"],
    layout: refs.layout("official.layout.workbench-dashboard"),
    theme: refs.theme("official.theme.light"),
    backgroundProvider: refs.background("official.background.default"),
    search: searchSettings(),
    regions: [{ regionId: "mainGrid", accepts: ["widget"] }],
    instances: [],
  }
}

function shellConfig() {
  return {
    themeIds: {
      light: "theme.light.custom",
      dark: "theme.dark.custom",
    },
    layoutIds: {
      dashboard: "layout.dashboard.custom",
    },
    settingsPanelIds: {
      appearance: "settings.appearance.custom",
    },
    searchHistory: {
      pluginId: "search.plugin.custom",
      key: "search-history-custom",
    },
  }
}

function controllerSetup() {
  let currentWorkspace: Workspace | null = workspace()
  let currentInstances = [instance()]
  let currentSearchSettings = searchSettings()
  let currentHistory: SearchHistoryEntry[] = [
    {
      query: "existing",
      providerId: "official.search.google",
      timestamp: "2026-06-07T00:00:00.000Z",
    },
  ]

  const themes: Array<ThemeContribution & { ref: ReturnType<typeof refs.theme> }> = [
    {
      id: "official.theme.light",
      title: "Light",
      tokens: { "color-page": "255 255 255" },
      ref: refs.theme("official.theme.light"),
    },
    {
      id: "official.theme.dark",
      title: "Dark",
      tokens: { "color-page": "10 10 10" },
      ref: refs.theme("official.theme.dark"),
    },
  ]
  const backgrounds: Array<
    BackgroundProviderContribution & { ref: ReturnType<typeof refs.background> }
  > = [
    {
      id: "official.background.default",
      title: "Default",
      sourceType: "generated",
      defaultCss: { background: "rgb(255 255 255)" },
      ref: refs.background("official.background.default"),
    },
    {
      id: "official.background.dark",
      title: "Dark",
      sourceType: "generated",
      defaultCss: { background: "rgb(10 10 10)" },
      ref: refs.background("official.background.dark"),
    },
  ]
  const providers = [
    {
      id: "official.search.google",
      title: "Google",
      shortcut: "g",
      urlTemplate: "https://google.example/search?q={query}",
      ref: refs.provider("official.search.google"),
    },
    {
      id: "official.search.duckduckgo",
      title: "DuckDuckGo",
      shortcut: "d",
      urlTemplate: "https://duck.example/search?q={query}",
      ref: refs.provider("official.search.duckduckgo"),
    },
  ]

  const setWorkspaceState = vi.fn((next: Workspace) => {
    currentWorkspace = next
  })
  const setWorkspaceList = vi.fn()
  const setActiveLayoutId = vi.fn()
  const setSearchSettings = vi.fn(
    (
      updater:
        | WorkbenchSearchSettings
        | ((prev: WorkbenchSearchSettings) => WorkbenchSearchSettings),
    ) => {
      currentSearchSettings =
        typeof updater === "function" ? updater(currentSearchSettings) : updater
    },
  )
  const setSearchHistory = vi.fn()
  const setInstances = vi.fn((next: PluginInstance[]) => {
    currentInstances = next
  })
  const setThemeId = vi.fn()
  const setBackgroundId = vi.fn()
  const applyTheme = vi.fn()
  const applyBackground = vi.fn()
  const clearContextMenu = vi.fn()
  const clearExpandState = vi.fn()
  const saveInstance = vi.fn(async () => {})
  const saveForWorkspace = vi.fn(async () => {})
  const kernel = {
    setPluginEnabled: vi.fn(async () => {}),
    revokePermission: vi.fn(async () => {}),
  }
  const syncPluginStyles = vi.fn()
  const i18n = { locale: vi.fn(() => "zh-CN" as const), setLocale: vi.fn() }
  const database = {} as unknown as TaboraDatabase
  const workspaceRepo: WorkspaceRepository = {
    get: vi.fn(async () => undefined),
    getAll: vi.fn(async () => []),
    save: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
  }
  const instanceRepo: InstanceRepository = {
    getAll: vi.fn(async () => []),
    getByWorkspace: vi.fn(async () => []),
    get: vi.fn(async () => undefined),
    save: saveInstance,
    removeByWorkspace: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
  }
  const pluginDataRepo: PluginDataRepository = {
    get: vi.fn(async () => undefined),
    getAll: vi.fn(async () => []),
    save: vi.fn(async () => {}),
    remove: vi.fn(async () => {}),
    getByWorkspace: vi.fn(async () => undefined),
    getAllByWorkspace: vi.fn(async () => []),
    saveForWorkspace,
    removeForWorkspace: vi.fn(async () => {}),
    removeByWorkspace: vi.fn(async () => {}),
    getByInstance: vi.fn(async () => undefined),
    getAllByInstance: vi.fn(async () => []),
    saveForInstance: vi.fn(async () => {}),
    removeForInstance: vi.fn(async () => {}),
  }

  const controller = createWorkbenchWorkspaceController({
    workspaceRepo,
    instanceRepo,
    pluginDataRepo,
    database,
    kernel,
    pluginCatalog: {
      pluginIds: () => ["plugin.widgets"],
      listThemes: () => themes,
      listBackgroundProviders: () => backgrounds,
      listSearchProviders: () => providers,
    },
    getWorkspaceState: () => currentWorkspace,
    getInstances: () => currentInstances,
    getSearchSettings: () => currentSearchSettings,
    getSearchHistory: () => currentHistory,
    setWorkspaceState,
    setWorkspaceList,
    setActiveLayoutId,
    setSearchSettings,
    setSearchHistory: vi.fn((history: SearchHistoryEntry[]) => {
      currentHistory = history
      setSearchHistory(history)
    }),
    setInstances,
    setThemeId,
    setBackgroundId,
    applyTheme,
    applyBackground,
    i18n,
    clearContextMenu,
    clearExpandState,
    defaultWorkspacePreset: defaultWorkspacePreset(),
    shellConfig: shellConfig(),
    assignGridOrder: (instances) => instances,
    warn: vi.fn(),
    syncPluginStyles,
  })

  return {
    controller,
    kernel,
    providers,
    themes,
    backgrounds,
    clearContextMenu,
    clearExpandState,
    setSearchSettings,
    setWorkspaceState,
    saveForWorkspace,
    syncPluginStyles,
  }
}

describe("createWorkbenchWorkspaceController", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.createWorkbenchWorkspaceState.mockReturnValue(mocks.workspaceStateActions)
  })

  it("builds theme/background selection helpers from the current catalog", () => {
    const { controller, themes, backgrounds } = controllerSetup()

    controller.applyThemeSelection("official.theme.dark")
    controller.applyBackgroundSelection("official.background.dark")

    expect(mocks.applyWorkbenchThemeSelection).toHaveBeenCalledWith(
      expect.objectContaining({
        themeId: "official.theme.dark",
        themes,
      }),
    )
    expect(mocks.applyWorkbenchBackgroundSelection).toHaveBeenCalledWith(
      expect.objectContaining({
        backgroundId: "official.background.dark",
        backgrounds,
      }),
    )
  })

  it("delegates search provider updates to the search state helpers with current catalog data", async () => {
    const { controller, providers, setSearchSettings } = controllerSetup()

    const provider = refs.provider("official.search.duckduckgo")
    await controller.setDefaultSearchProvider(provider)
    await controller.setSearchProviderEnabled(provider, true)

    expect(mocks.setWorkbenchDefaultSearchProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        provider,
        providers,
        setSearchSettings,
      }),
    )
    expect(mocks.setWorkbenchSearchProviderEnabled).toHaveBeenCalledWith(
      expect.objectContaining({
        provider,
        enabled: true,
        providers,
      }),
    )
  })

  it("persists search history for the active workspace", async () => {
    const { controller, saveForWorkspace } = controllerSetup()

    await controller.saveSearchHistory({
      query: "tabora",
      providerId: "official.search.google",
    })

    expect(mocks.saveWorkbenchSearchHistory).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceId: "workspace-1",
        history: [
          {
            query: "existing",
            providerId: "official.search.google",
            timestamp: "2026-06-07T00:00:00.000Z",
          },
        ],
        entry: {
          query: "tabora",
          providerId: "official.search.google",
        },
      }),
    )
    expect(saveForWorkspace).not.toHaveBeenCalled()
  })

  it("delegates workspace theme/background switching and plugin enable toggles", async () => {
    const { controller, kernel, syncPluginStyles } = controllerSetup()

    const theme = refs.theme("official.theme.dark")
    const background = refs.background("official.background.dark")
    await controller.switchTheme(theme)
    await controller.switchBackground(background)
    await controller.togglePluginEnabled("plugin.widgets", false)
    await controller.togglePluginEnabled("plugin.widgets", true)

    expect(mocks.switchWorkbenchTheme).toHaveBeenCalledWith(
      expect.objectContaining({
        theme,
        workspace: expect.objectContaining({ id: "workspace-1" }),
      }),
    )
    expect(mocks.switchWorkbenchBackground).toHaveBeenCalledWith(
      expect.objectContaining({
        background,
        workspace: expect.objectContaining({ id: "workspace-1" }),
      }),
    )
    expect(kernel.setPluginEnabled).toHaveBeenNthCalledWith(1, "plugin.widgets", false)
    expect(kernel.setPluginEnabled).toHaveBeenNthCalledWith(2, "plugin.widgets", true)
    expect(syncPluginStyles).toHaveBeenCalledTimes(2)
  })

  it("revokes a granted permission through the kernel and refreshes the plugin records", async () => {
    const { controller, kernel, syncPluginStyles } = controllerSetup()
    const permission: PluginPermission = { type: "network", hosts: ["api.example.com"] }

    await controller.revokePluginPermission("plugin.widgets", permission)

    expect(kernel.revokePermission).toHaveBeenCalledWith("plugin.widgets", permission)
    expect(syncPluginStyles).toHaveBeenCalledTimes(1)
  })
})
