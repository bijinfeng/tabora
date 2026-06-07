import type { PluginInstance, WidgetSize } from "@tabora/plugin-api"
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

vi.mock("@tabora/orchestrator", () => ({
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

describe("createWorkbenchShellLayoutRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    buildRegionSlots.mockClear()
    buildHostAPI.mockClear()
    renderActiveLayout.mockClear()
  })

  it("assembles the layout host api, engine, and renderer into a single runtime", () => {
    const catalog = {
      findLayoutContribution: vi.fn(() => undefined),
    }

    const runtime = createWorkbenchShellLayoutRuntime({
      activeLayoutId: () => "official.layout.workbench-dashboard",
      isDark: () => false,
      setCommandPaletteOpen: vi.fn(),
      setAddWidgetOpen: vi.fn(),
      openSettings: vi.fn(),
      switchLayout: vi.fn(),
      switchTheme: vi.fn(),
      runRailAction: vi.fn(),
      catalog: catalog as unknown as Parameters<
        typeof createWorkbenchShellLayoutRuntime
      >[0]["catalog"],
      instanceRenderer: vi.fn() as unknown as Parameters<
        typeof createWorkbenchShellLayoutRuntime
      >[0]["instanceRenderer"],
      displayedInstances: () => [instance()],
      resolveLayoutView: vi.fn() as Parameters<
        typeof createWorkbenchShellLayoutRuntime
      >[0]["resolveLayoutView"],
      isMobile: () => false,
      clearLayoutError: vi.fn(),
      recordLayoutError: vi.fn(),
      setContextMenu: vi.fn(),
      widgetContribution: vi.fn(),
      resolveWidgetModel: vi.fn(),
      getWidgetView: vi.fn(),
      renderWidgetIcon: vi.fn(),
      buildWidgetViewProps: vi.fn(),
      onPointerDown: vi.fn(),
      onPointerMove: vi.fn(),
      onPointerUp: vi.fn(),
      onPointerCancel: vi.fn(),
      openWidgetExpand: vi.fn(),
      changeWidgetSize: vi.fn(async () => {}),
      removeWidget: vi.fn(async () => {}),
      isDragging: vi.fn(() => false),
    })

    expect(runtime.renderActiveLayout()).toBe("layout-content")
    expect(mocks.createWorkbenchLayoutHostAPI).toHaveBeenCalledWith(
      expect.objectContaining({
        activeLayoutId: expect.any(Function),
        isDark: expect.any(Function),
        setCommandPaletteOpen: expect.any(Function),
        setAddWidgetOpen: expect.any(Function),
        openSettings: expect.any(Function),
        switchLayout: expect.any(Function),
        switchTheme: expect.any(Function),
        runRailAction: expect.any(Function),
      }),
    )
    expect(mocks.createLayoutEngine).toHaveBeenCalledWith({
      catalog,
      instanceRenderer: expect.any(Function),
      hostActions: hostApi,
    })

    const rendererCalls = mocks.createWorkbenchLayoutRenderer.mock.calls as unknown as Array<
      [
        {
          activeLayoutId: () => string
          findLayoutContribution: (layoutId: string) => unknown
          buildRegionSlots: (layoutId: string, instances: PluginInstance[]) => unknown
          buildHostAPI: () => unknown
        },
      ]
    >
    const rendererOptions = rendererCalls[0]?.[0]

    expect(rendererOptions?.activeLayoutId()).toBe("official.layout.workbench-dashboard")
    expect(rendererOptions?.findLayoutContribution("layout.dashboard")).toBeUndefined()
    expect(catalog.findLayoutContribution).toHaveBeenCalledWith("layout.dashboard")
    expect(rendererOptions?.buildRegionSlots("layout.dashboard", [instance()])).toEqual({
      main: { regionId: "main" },
    })
    expect(buildRegionSlots).toHaveBeenCalledWith("layout.dashboard", [
      expect.objectContaining({ id: "widget-1" }),
    ])
    expect(rendererOptions?.buildHostAPI()).toEqual(engineHostApi)
    expect(buildHostAPI).toHaveBeenCalledTimes(1)
  })

  it("bridges safe layout callbacks through the runtime host actions", () => {
    const setContextMenu = vi.fn()
    const setCommandPaletteOpen = vi.fn()
    const openSettings = vi.fn()
    const switchTheme = vi.fn()
    const changeWidgetSize = vi.fn(async () => {})
    const removeWidget = vi.fn(async () => {})

    createWorkbenchShellLayoutRuntime({
      activeLayoutId: () => "official.layout.workbench-dashboard",
      isDark: () => false,
      setCommandPaletteOpen,
      setAddWidgetOpen: vi.fn(),
      openSettings,
      switchLayout: vi.fn(),
      switchTheme,
      runRailAction: vi.fn(),
      catalog: {
        findLayoutContribution: vi.fn(() => undefined),
      } as unknown as Parameters<typeof createWorkbenchShellLayoutRuntime>[0]["catalog"],
      instanceRenderer: vi.fn() as unknown as Parameters<
        typeof createWorkbenchShellLayoutRuntime
      >[0]["instanceRenderer"],
      displayedInstances: () => [instance()],
      resolveLayoutView: vi.fn() as Parameters<
        typeof createWorkbenchShellLayoutRuntime
      >[0]["resolveLayoutView"],
      isMobile: () => false,
      clearLayoutError: vi.fn(),
      recordLayoutError: vi.fn(),
      setContextMenu,
      widgetContribution: vi.fn(),
      resolveWidgetModel: vi.fn(),
      getWidgetView: vi.fn(),
      renderWidgetIcon: vi.fn(),
      buildWidgetViewProps: vi.fn(),
      onPointerDown: vi.fn(),
      onPointerMove: vi.fn(),
      onPointerUp: vi.fn(),
      onPointerCancel: vi.fn(),
      openWidgetExpand: vi.fn(),
      changeWidgetSize,
      removeWidget,
      isDragging: vi.fn(() => false),
    })

    const rendererCalls = mocks.createWorkbenchLayoutRenderer.mock.calls as unknown as Array<
      [
        {
          safeLayout: {
            onOpenCommandPalette: () => void
            onToggleTheme: () => void
            onOpenSettings: () => void
            onOpenContextMenu: (event: MouseEvent, instanceId: string) => void
            onResize: (instanceId: string, size: WidgetSize) => void
            onRemove: (instanceId: string) => void
          }
        },
      ]
    >
    const safeLayout = rendererCalls[0]?.[0].safeLayout
    const preventDefault = vi.fn()

    safeLayout?.onOpenCommandPalette()
    safeLayout?.onToggleTheme()
    safeLayout?.onOpenSettings()
    safeLayout?.onOpenContextMenu(
      { preventDefault, clientX: 16, clientY: 24 } as unknown as MouseEvent,
      "widget-1",
    )
    safeLayout?.onResize("widget-1", "L")
    safeLayout?.onRemove("widget-1")

    expect(setCommandPaletteOpen).toHaveBeenCalledWith(true)
    expect(switchTheme).toHaveBeenCalledWith("official.theme.dark")
    expect(openSettings).toHaveBeenCalledWith()
    expect(preventDefault).toHaveBeenCalledTimes(1)
    expect(setContextMenu).toHaveBeenCalledWith({ x: 16, y: 24, instanceId: "widget-1" })
    expect(changeWidgetSize).toHaveBeenCalledWith("widget-1", "L")
    expect(removeWidget).toHaveBeenCalledWith("widget-1")
  })
})
