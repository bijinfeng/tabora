import { describe, expect, it, vi, beforeEach } from "vitest"
import { render } from "solid-js/web"

const executeKeydown = vi.fn()
const closeExpand = vi.fn()
const setCtxMenu = vi.fn()
const setAddWidgetOpen = vi.fn()

vi.mock("../surface/WorkbenchShellSettings", () => ({
  createWorkbenchSettingsPanelPropsBuilder: vi.fn(() => vi.fn(() => ({}))),
  openWorkbenchSettings: vi.fn(),
}))

vi.mock("../shared/responsive", () => ({
  createWorkbenchResponsiveState: vi.fn(() => ({})),
}))

vi.mock("../runtime/WorkbenchShellHostRuntime", () => ({
  createWorkbenchShellHostRuntime: vi.fn(() => ({
    initialize: vi.fn(),
    dispose: vi.fn(),
  })),
}))

vi.mock("../shared/pluginStyleManager", () => ({
  activePluginStyles: vi.fn(() => []),
  createPluginStyleManager: vi.fn(() => ({
    apply: vi.fn(),
    dispose: vi.fn(),
  })),
}))

vi.mock("../layout/layoutFallback", () => ({
  createLayoutFallbackTracker: vi.fn(() => ({})),
}))

vi.mock("../workspace/WorkbenchShellWorkspaceController", () => ({
  createWorkbenchWorkspaceController: vi.fn(() => ({
    switchTheme: vi.fn(),
    switchLayout: vi.fn(),
    switchBackground: vi.fn(),
    switchLocale: vi.fn(),
    setDefaultSearchProvider: vi.fn(),
    setSearchProviderEnabled: vi.fn(),
    togglePluginEnabled: vi.fn(),
    exportWorkspace: vi.fn(),
    importWorkspace: vi.fn(),
    createWorkspace: vi.fn(),
    switchWorkspace: vi.fn(),
    deleteWorkspace: vi.fn(),
    applyThemeSelection: vi.fn(),
    applyBackgroundSelection: vi.fn(),
    reconcileInstancesForLayout: vi.fn(),
  })),
}))

vi.mock("./createWorkbenchShellRuntimes", () => ({
  createWorkbenchShellRuntimes: vi.fn(() => ({
    controllerRuntime: {
      shortcutRegistry: () => ({ executeKeydown }),
      widgetController: { closeExpand },
    },
    layoutRuntime: {
      renderActiveLayout: () => <div>layout</div>,
    },
  })),
}))

vi.mock("../surface/WorkbenchShellSurfaceHost", () => ({
  WorkbenchShellSurfaceHost: () => <div>surface</div>,
}))

vi.mock("./WorkbenchShellState", () => ({
  createWorkbenchShellState: vi.fn(() => ({
    runtime: {
      kernelReady: () => true,
      setKernelReady: vi.fn(),
      pluginRecords: () => [],
      setPluginRecords: vi.fn(),
      showToast: vi.fn(),
    },
    workspace: {
      workspaceState: () => null,
      setWorkspaceState: vi.fn(),
      workspaceList: () => [],
      setWorkspaceList: vi.fn(),
    },
    appearance: {
      activeLayoutId: () => "layout.dashboard.custom",
      setActiveLayoutId: vi.fn(),
      setThemeId: vi.fn(),
      setBackgroundId: vi.fn(),
      isDark: () => false,
    },
    widgets: {
      instances: () => [],
      setInstances: vi.fn(),
    },
    overlays: {
      setSettingsOpen: vi.fn(),
      setActiveSettingsSectionId: vi.fn(),
      setModalViewId: vi.fn(),
      setModalProps: vi.fn(),
      setFullscreenViewId: vi.fn(),
      setFullscreenProps: vi.fn(),
      expandState: () => null,
      setExpandState: vi.fn(),
      dragState: () => null,
      setDragState: vi.fn(),
      ctxMenu: () => null,
      setCtxMenu,
      setAddWidgetOpen,
      cmdPaletteOpen: () => false,
      setCmdPaletteOpen: vi.fn(),
    },
    search: {
      searchSettings: () => ({ defaultProviderId: "", enabledProviderIds: [] }),
      setSearchSettings: vi.fn(),
      searchHistory: () => [],
      setSearchHistory: vi.fn(),
      inlineSearchQuery: () => "",
      setInlineSearchQuery: vi.fn(),
      inlineSearchOpen: () => false,
      setInlineSearchOpen: vi.fn(),
      inlineSearchActiveResultIndex: () => 0,
      setInlineSearchActiveResultIndex: vi.fn(),
    },
  })),
}))

vi.mock("../i18n", () => ({
  createWorkbenchShellPluginViewBoundaryCopy: vi.fn(() => ({})),
}))

import { WorkbenchShellApp } from "./WorkbenchShellApp"

function composition() {
  return {
    host: { platform: "web" },
    initialState: {
      workspace: null,
      instances: [],
      searchSettings: { defaultProviderId: "", enabledProviderIds: [] },
    },
  }
}

function runtime() {
  return {
    defaultWorkspacePreset: {
      layoutId: "layout.dashboard.custom",
      themeId: "theme.light.custom",
      backgroundProviderId: "background.default",
    },
    shellConfig: {
      themeIds: { light: "theme.light.custom", dark: "theme.dark.custom" },
      layoutIds: { dashboard: "layout.dashboard.custom", focus: "layout.focus.custom" },
      settingsPanelIds: { appearance: "settings.appearance.custom" },
      searchHistory: { pluginId: "search.plugin.custom", key: "search-history-custom" },
    },
    repositories: {
      workspaceRepo: {},
      instanceRepo: {},
      pluginDataRepo: {},
      workspaceSnapshotRepo: {},
      pluginRecordRepo: { getAll: vi.fn(async () => []) },
    },
    catalog: {
      listSettingsPanels: vi.fn(() => []),
      listLayouts: vi.fn(() => []),
      listThemes: vi.fn(() => []),
      listBackgroundProviders: vi.fn(() => []),
      listSearchProviders: vi.fn(() => []),
      pluginSummaries: vi.fn(() => []),
    },
    kernel: { registry: { views: {} } },
    plugins: [],
    database: {},
    pluginStyles: [],
    i18n: {
      locale: () => "zh-CN",
      setLocale: vi.fn(),
      t: (_ns: string, key: string) => key,
    },
  }
}

describe("WorkbenchShellApp", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("handles global shortcuts from window even when the root is not focused", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => <WorkbenchShellApp composition={composition() as never} runtime={runtime() as never} />,
      root,
    )

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }))

    expect(executeKeydown).toHaveBeenCalled()
    root.remove()
  })
})
