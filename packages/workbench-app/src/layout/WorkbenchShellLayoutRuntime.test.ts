import type { PluginInstance } from "@tabora/plugin-api"
import { beforeEach, describe, expect, it, vi } from "vitest"

const hostApi = { sentinel: "layout-host" }
const engineHostApi = { sentinel: "engine-host" }
const buildRegionSlots = vi.fn(() => ({ main: { regionId: "main" } }))
const buildHostAPI = vi.fn(() => engineHostApi)
const renderActiveLayout = vi.fn(() => "layout-content")

const mocks = vi.hoisted(() => ({
  createWorkbenchLayoutHostAPI: vi.fn(() => hostApi),
  createLayoutEngine: vi.fn(() => ({
    buildRegionSlots,
    buildHostAPI,
  })),
  createWorkbenchLayoutRenderer: vi.fn(() => ({
    renderActiveLayout,
  })),
}))

vi.mock("./WorkbenchShellLayoutHost", () => ({
  createWorkbenchLayoutHostAPI: mocks.createWorkbenchLayoutHostAPI,
}))

vi.mock("./layoutEngine", () => ({
  createLayoutEngine: mocks.createLayoutEngine,
}))

vi.mock("./WorkbenchShellLayoutRenderer", () => ({
  createWorkbenchLayoutRenderer: mocks.createWorkbenchLayoutRenderer,
}))

import { createWorkbenchShellLayoutRuntime } from "./WorkbenchShellLayoutRuntime"

function instance(overrides: Partial<PluginInstance> = {}): PluginInstance {
  return {
    id: "widget-1",
    workspaceId: "workspace-1",
    contribution: { pluginId: "plugin.widgets", kind: "widget", id: "widget.notes" },
    regionId: "mainGrid",
    enabled: true,
    size: "M",
    config: {},
    createdAt: "2026-06-07T00:00:00.000Z",
    updatedAt: "2026-06-07T00:00:00.000Z",
    ...overrides,
  }
}

function options(overrides: Partial<Parameters<typeof createWorkbenchShellLayoutRuntime>[0]> = {}) {
  return {
    activeLayoutId: () => "layout.dashboard.custom",
    layoutError: () => null,
    isDark: () => false,
    setCommandPaletteOpen: vi.fn(),
    setAddWidgetOpen: vi.fn(),
    openSettings: vi.fn(),
    readLayoutState: vi.fn(),
    writeLayoutState: vi.fn(),
    showToast: vi.fn(),
    switchLayout: vi.fn(),
    switchTheme: vi.fn(),
    runRailAction: vi.fn(),
    shellConfig: {
      themeIds: { light: "theme.light.custom", dark: "theme.dark.custom" },
      layoutIds: {
        dashboard: "layout.dashboard.custom",
        focus: "layout.focus.custom",
        mobile: "layout.mobile.custom",
      },
      settingsPanelIds: { appearance: "settings.appearance.custom" },
      searchHistory: { pluginId: "search.plugin.custom", key: "search-history-custom" },
    },
    catalog: {
      findLayoutContribution: vi.fn(() => undefined),
    },
    instanceRenderer: vi.fn(),
    displayedInstances: () => [instance()],
    resolveLayoutView: vi.fn(),
    isMobile: () => false,
    clearLayoutError: vi.fn(),
    recordLayoutError: vi.fn(),
    ...overrides,
  } as Parameters<typeof createWorkbenchShellLayoutRuntime>[0]
}

describe("createWorkbenchShellLayoutRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    buildRegionSlots.mockClear()
    buildHostAPI.mockClear()
    renderActiveLayout.mockClear()
  })

  it("assembles the layout host api, engine, and renderer", () => {
    const runtime = createWorkbenchShellLayoutRuntime(options())

    expect(runtime.renderActiveLayout()).toBe("layout-content")
    expect(mocks.createWorkbenchLayoutHostAPI).toHaveBeenCalledWith(
      expect.objectContaining({
        activeLayoutId: expect.any(Function),
        isDark: expect.any(Function),
        setCommandPaletteOpen: expect.any(Function),
        setAddWidgetOpen: expect.any(Function),
        openSettings: expect.any(Function),
        readLayoutState: expect.any(Function),
        writeLayoutState: expect.any(Function),
        showToast: expect.any(Function),
        switchLayout: expect.any(Function),
        switchTheme: expect.any(Function),
        runRailAction: expect.any(Function),
      }),
    )
    expect(mocks.createLayoutEngine).toHaveBeenCalledWith({
      catalog: expect.anything(),
      instanceRenderer: expect.any(Function),
      hostActions: hostApi,
    })

    const rendererOptions = (
      mocks.createWorkbenchLayoutRenderer.mock.calls as unknown as Array<
        [
          {
            activeLayoutId: () => string
            layoutError: () => unknown
            findLayoutContribution: (layoutId: string) => unknown
            buildRegionSlots: (layoutId: string, instances: PluginInstance[]) => unknown
            buildHostAPI: () => unknown
          },
        ]
      >
    )[0]![0]
    expect(rendererOptions.activeLayoutId()).toBe("layout.dashboard.custom")
    expect(rendererOptions.layoutError()).toBeNull()
    expect(rendererOptions.findLayoutContribution("layout.dashboard")).toBeUndefined()
    expect(rendererOptions.buildRegionSlots("layout.dashboard", [instance()])).toEqual({
      main: { regionId: "main" },
    })
    expect(rendererOptions.buildHostAPI()).toEqual(engineHostApi)
    expect(buildHostAPI).toHaveBeenCalledTimes(1)
  })

  it("renders the dedicated mobile layout without mutating the stored desktop choice", () => {
    const catalog = {
      findLayoutContribution: vi.fn((layoutId: string) =>
        layoutId === "layout.mobile.custom" ? { id: layoutId } : undefined,
      ),
    } as unknown as Parameters<typeof createWorkbenchShellLayoutRuntime>[0]["catalog"]

    createWorkbenchShellLayoutRuntime(
      options({
        catalog,
        isMobile: () => true,
        activeLayoutId: () => "layout.dashboard.custom",
      }),
    )

    const rendererOptions = (
      mocks.createWorkbenchLayoutRenderer.mock.calls as unknown as Array<
        [{ activeLayoutId: () => string }]
      >
    )[0]![0]
    const hostOptions = (
      mocks.createWorkbenchLayoutHostAPI.mock.calls as unknown as Array<
        [{ activeLayoutId: () => string }]
      >
    )[0]![0]

    expect(rendererOptions.activeLayoutId()).toBe("layout.mobile.custom")
    expect(hostOptions.activeLayoutId()).toBe("layout.dashboard.custom")
    expect(catalog.findLayoutContribution).toHaveBeenCalledWith("layout.mobile.custom")
  })

  it("forwards the current layout error to the renderer", () => {
    const layoutError = {
      layoutId: "layout.dashboard.custom",
      message: "layout crashed",
    }

    createWorkbenchShellLayoutRuntime(options({ layoutError: () => layoutError }))

    const rendererOptions = (
      mocks.createWorkbenchLayoutRenderer.mock.calls as unknown as Array<
        [{ layoutError: () => unknown }]
      >
    )[0]![0]
    expect(rendererOptions.layoutError()).toEqual(layoutError)
  })
})
