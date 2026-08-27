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

vi.mock("../layout/layoutError", () => ({
  createLayoutErrorTracker: vi.fn(() => ({})),
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
      settingsOpen: () => false,
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
      searchSettings: () => ({
        defaultProvider: { pluginId: "test.search", kind: "search-provider", id: "default" },
        enabledProviders: [],
      }),
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
      searchSettings: {
        defaultProvider: { pluginId: "test.search", kind: "search-provider", id: "default" },
        enabledProviders: [],
      },
    },
  }
}

function runtime() {
  return {
    defaultWorkspacePreset: {
      layout: { pluginId: "test.layout", kind: "layout", id: "layout.dashboard.custom" },
      theme: { pluginId: "test.theme", kind: "theme", id: "theme.light.custom" },
      backgroundProvider: {
        pluginId: "test.background",
        kind: "background-provider",
        id: "background.default",
      },
    },
    shellConfig: {
      themeIds: { light: "theme.light.custom", dark: "theme.dark.custom" },
      layoutIds: { dashboard: "layout.dashboard.custom" },
      settingsPanelIds: { appearance: "settings.appearance.custom" },
      searchHistory: { pluginId: "search.plugin.custom", key: "search-history-custom" },
    },
    repositories: {
      workspaceRepo: {},
      instanceRepo: {},
      pluginDataRepo: {},
      pluginRecordRepo: { getAll: vi.fn(async () => []) },
    },
    catalog: {
      listSettingsPanels: vi.fn(() => []),
      listThemes: vi.fn(() => []),
      listBackgroundProviders: vi.fn(() => []),
      listSearchProviders: vi.fn(() => []),
      pluginSummaries: vi.fn(() => []),
    },
    kernel: {
      registry: { views: {} },
      events: { on: vi.fn(() => vi.fn()), emit: vi.fn() },
      plugins: [],
    },
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

    expect(root.querySelector("[data-workbench-shell-root]")).toBeTruthy()
    expect(root.querySelector(".tabora-root")).toBeNull()

    window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }))

    expect(executeKeydown).toHaveBeenCalled()
    root.remove()
  })
})
