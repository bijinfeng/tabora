import type {
  BackgroundProviderContribution,
  LayoutContribution,
  PluginInstance,
  SearchHistoryEntry,
  ThemeContribution,
  WorkbenchSearchSettings,
  Workspace,
  WorkspacePresetContribution,
} from "@tabora/plugin-api"
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
    updateWorkspaceRecord: vi.fn(async () => workspace({ activeLayoutId: "layout.next" })),
    updateWorkspaceTheme: vi.fn(async () => workspace({ activeThemeId: "official.theme.dark" })),
    updateWorkspaceBackground: vi.fn(async () =>
      workspace({ activeBackgroundProviderId: "official.background.dark" }),
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

function workspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: "workspace-1",
    name: "默认工作区",
    activeLayoutId: "official.layout.workbench-dashboard",
    activeThemeId: "official.theme.light",
    activeBackgroundProviderId: "official.background.default",
    config: {},
    regions: {},
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
    defaultProviderId: "official.search.google",
    enabledProviderIds: ["official.search.google"],
    ...overrides,
  }
}

function defaultWorkspacePreset(): WorkspacePresetContribution {
  return {
    id: "preset.default",
    title: "Default Workspace",
    plugins: ["plugin.widgets"],
    layoutId: "official.layout.workbench-dashboard",
    themeId: "official.theme.light",
    backgroundProviderId: "official.background.default",
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
      stream: "layout.stream.custom",
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

  const themes: ThemeContribution[] = [
    { id: "official.theme.light", title: "Light", tokens: { "color-page": "255 255 255" } },
    { id: "official.theme.dark", title: "Dark", tokens: { "color-page": "10 10 10" } },
  ]
  const backgrounds: BackgroundProviderContribution[] = [
    {
      id: "official.background.default",
      title: "Default",
      sourceType: "generated",
      defaultCss: { background: "rgb(255 255 255)" },
    },
    {
      id: "official.background.dark",
      title: "Dark",
      sourceType: "generated",
      defaultCss: { background: "rgb(10 10 10)" },
    },
  ]
  const layouts: LayoutContribution[] = [
    {
      id: "official.layout.workbench-dashboard",
      title: "Dashboard",
      regions: [{ id: "mainGrid", title: "Grid", accepts: ["widget"] }],
      defaultRegions: {},
      supportsResponsive: true,
    },
    {
      id: "layout.next",
      title: "Next",
      regions: [{ id: "grid", title: "Grid", accepts: ["widget"] }],
      defaultRegions: {},
      supportsResponsive: true,
    },
  ]
  const providers = [
    {
      id: "official.search.google",
      title: "Google",
      shortcut: "g",
      urlTemplate: "https://google.example/search?q={query}",
    },
    {
      id: "official.search.duckduckgo",
      title: "DuckDuckGo",
      shortcut: "d",
      urlTemplate: "https://duck.example/search?q={query}",
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
  const kernel = { setPluginEnabled: vi.fn(async () => {}) }
  const syncPluginStyles = vi.fn()

  const controller = createWorkbenchWorkspaceController({
    workspaceRepo: {} as any,
    instanceRepo: { save: saveInstance } as any,
    pluginDataRepo: { saveForWorkspace } as any,
    workspaceSnapshotRepo: { save: vi.fn(async () => {}) } as any,
    database: {} as any,
    kernel,
    pluginCatalog: {
      pluginIds: () => ["plugin.widgets"],
      listThemes: () => themes,
      listBackgroundProviders: () => backgrounds,
      listLayouts: () => layouts,
      findLayoutContribution: (layoutId: string) =>
        layouts.find((layout) => layout.id === layoutId),
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

  it("wires layout switching through the shared layout state helper", async () => {
    const { controller, clearContextMenu, clearExpandState } = controllerSetup()

    await controller.switchLayout("layout.next")

    expect(mocks.switchWorkbenchLayout).toHaveBeenCalledWith(
      expect.objectContaining({
        layoutId: "layout.next",
        activeWorkspace: expect.objectContaining({ id: "workspace-1" }),
        currentInstances: [expect.objectContaining({ id: "widget-1" })],
      }),
    )

    const switchOptions = (
      mocks.switchWorkbenchLayout.mock.calls as unknown as Array<[unknown]>
    )[0]?.[0] as
      | {
          clearContextMenu: () => void
          clearExpandState: () => void
        }
      | undefined
    switchOptions?.clearContextMenu()
    switchOptions?.clearExpandState()

    expect(clearContextMenu).toHaveBeenCalled()
    expect(clearExpandState).toHaveBeenCalled()
  })

  it("delegates search provider updates to the search state helpers with current catalog data", async () => {
    const { controller, providers, setSearchSettings } = controllerSetup()

    await controller.setDefaultSearchProvider("official.search.duckduckgo")
    await controller.setSearchProviderEnabled("official.search.duckduckgo", true)

    expect(mocks.setWorkbenchDefaultSearchProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: "official.search.duckduckgo",
        providers,
        setSearchSettings,
      }),
    )
    expect(mocks.setWorkbenchSearchProviderEnabled).toHaveBeenCalledWith(
      expect.objectContaining({
        providerId: "official.search.duckduckgo",
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

    await controller.switchTheme("official.theme.dark")
    await controller.switchBackground("official.background.dark")
    await controller.togglePluginEnabled("plugin.widgets", false)

    expect(mocks.switchWorkbenchTheme).toHaveBeenCalledWith(
      expect.objectContaining({
        themeId: "official.theme.dark",
        workspace: expect.objectContaining({ id: "workspace-1" }),
      }),
    )
    expect(mocks.switchWorkbenchBackground).toHaveBeenCalledWith(
      expect.objectContaining({
        backgroundId: "official.background.dark",
        workspace: expect.objectContaining({ id: "workspace-1" }),
      }),
    )
    expect(kernel.setPluginEnabled).toHaveBeenCalledWith("plugin.widgets", false)
    expect(syncPluginStyles).toHaveBeenCalled()
  })

  it("proxies workspace lifecycle methods through the shared workspace state actions", async () => {
    const { controller } = controllerSetup()

    await controller.exportWorkspace()
    await controller.importWorkspace("{}")
    await controller.createWorkspace("新工作区")
    await controller.switchWorkspace("workspace-2")
    await controller.deleteWorkspace("workspace-2")

    expect(mocks.workspaceStateActions.exportWorkspace).toHaveBeenCalled()
    expect(mocks.workspaceStateActions.importWorkspace).toHaveBeenCalledWith("{}")
    expect(mocks.workspaceStateActions.createWorkspace).toHaveBeenCalledWith("新工作区")
    expect(mocks.workspaceStateActions.switchWorkspace).toHaveBeenCalledWith("workspace-2")
    expect(mocks.workspaceStateActions.deleteWorkspace).toHaveBeenCalledWith("workspace-2")
  })
})
