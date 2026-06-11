import type {
  LayoutContribution,
  PluginInstance,
  SearchCommandEntry,
  SearchContribution,
  SearchHistoryEntry,
  SearchViewProps,
  SearchWidgetEntry,
  WidgetSize,
  WorkbenchSearchSettings,
} from "@tabora/plugin-api"
import type { SearchProviderContributionDescriptor } from "@tabora/orchestrator"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { createWorkbenchPointerDragHandlers } from "../drag/WorkbenchShellDragState"
import type { createWorkbenchSearchSurfaces } from "../search/WorkbenchShellSearchSurfaces"
import type { createWorkbenchShellCommandModels } from "../command/WorkbenchShellCommands"
import type { createWorkbenchShellViewRuntime } from "./WorkbenchShellViewRuntime"
import type { createWorkbenchWidgetController } from "../widget/WorkbenchShellWidgetController"
import type { WidgetRenderModel } from "../shared/shellHelpers"

const commandItems = vi.fn((): SearchCommandEntry[] => [])
const availableCommandIds = vi.fn(() => ["command.theme"])
const runCommand = vi.fn(() => true)
const shortcutRegistry = vi.fn(() => ({ executeKeydown: vi.fn(), listShortcutReferences: vi.fn() }))

const widgetContribution = vi.fn(() => undefined)
const widgetRenderModel = vi.fn(() => null)
const buildSearchableWidgets = vi.fn((): SearchWidgetEntry[] => [
  { instanceId: "widget-1", icon: "W", name: "Widget", desc: "Focus widget", action: vi.fn() },
])
const persistGridOrder = vi.fn(async () => {})
const changeWidgetSize = vi.fn(async () => {})
const removeWidget = vi.fn(async () => {})
const openWidgetExpand = vi.fn()

const buildInlineSearchViewProps = vi.fn(() => ({ entry: "inline" }) as SearchViewProps)
const buildCommandPaletteProps = vi.fn(() => ({ isOpen: false }))

const displayedInstances = vi.fn(() => [])
const onPointerDown = vi.fn()
const onPointerMove = vi.fn()
const onPointerUp = vi.fn()
const onPointerCancel = vi.fn()
const onDndDragStart = vi.fn()
const onDndDragMove = vi.fn()
const onDndDragOver = vi.fn()
const onDndDragEnd = vi.fn()
const isDragging = vi.fn(() => false)
const sortableIndex = vi.fn(() => 0)

const buildWidgetViewProps = vi.fn(() => ({ sentinel: "view-props" }))
const instanceRenderer = { renderWidget: vi.fn(), renderSearch: vi.fn() }

const mocks = vi.hoisted(() => ({
  createWorkbenchShellCommandModels: vi.fn((_options: unknown) => ({
    commandItems,
    availableCommandIds,
    runCommand,
    shortcutRegistry,
  })),
  createWorkbenchWidgetController: vi.fn((_options: unknown) => ({
    widgetContribution,
    widgetRenderModel,
    buildSearchableWidgets,
    persistGridOrder,
    changeWidgetSize,
    removeWidget,
    openWidgetExpand,
  })),
  createWorkbenchSearchSurfaces: vi.fn((_options: unknown) => ({
    buildInlineSearchViewProps,
    buildCommandPaletteProps,
  })),
  createWorkbenchPointerDragHandlers: vi.fn((_options: unknown) => ({
    displayedInstances,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerCancel,
    onDndDragStart,
    onDndDragMove,
    onDndDragOver,
    onDndDragEnd,
    isDragging,
    sortableIndex,
  })),
  createWorkbenchShellViewRuntime: vi.fn((_options: unknown) => ({
    buildWidgetViewProps,
    instanceRenderer,
  })),
}))

vi.mock("../command/WorkbenchShellCommands", () => ({
  createWorkbenchShellCommandModels: mocks.createWorkbenchShellCommandModels,
}))

vi.mock("../widget/WorkbenchShellWidgetController", () => ({
  createWorkbenchWidgetController: mocks.createWorkbenchWidgetController,
}))

vi.mock("../search/WorkbenchShellSearchSurfaces", () => ({
  createWorkbenchSearchSurfaces: mocks.createWorkbenchSearchSurfaces,
}))

vi.mock("../drag/WorkbenchShellDragState", () => ({
  createWorkbenchPointerDragHandlers: mocks.createWorkbenchPointerDragHandlers,
}))

vi.mock("./WorkbenchShellViewRuntime", () => ({
  createWorkbenchShellViewRuntime: mocks.createWorkbenchShellViewRuntime,
}))

import { createWorkbenchShellControllerRuntime } from "./WorkbenchShellControllerRuntime"

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

function searchSettings(): WorkbenchSearchSettings {
  return {
    defaultProviderId: "official.search.google",
    enabledProviderIds: ["official.search.google"],
  }
}

function options(): Parameters<typeof createWorkbenchShellControllerRuntime>[0] {
  const searchProviders: SearchProviderContributionDescriptor[] = [
    {
      id: "official.search.google",
      title: "Google",
      shortcut: "g",
      urlTemplate: "https://google.example/search?q={query}",
      pluginId: "official.search-providers.basic",
      pluginName: "基础搜索源",
    },
  ]
  const layoutContribution: LayoutContribution = {
    id: "official.layout.workbench-dashboard",
    title: "Dashboard",
    regions: [],
    defaultRegions: {},
    supportsResponsive: true,
  }
  const searchContribution: SearchContribution = {
    id: "official.search.command-bar",
    title: "Command Search",
    view: "official.search.command-bar",
  }

  return {
    shellConfig: {
      themeIds: {
        light: "theme.light.custom",
        dark: "theme.dark.custom",
      },
      layoutIds: {
        dashboard: "layout.dashboard.custom",
        focus: "layout.focus.custom",
      },
      settingsPanelIds: {
        appearance: "settings.appearance.custom",
      },
      searchHistory: {
        pluginId: "search.plugin.custom",
        key: "search-history-custom",
      },
    },
    services: {
      plugins: [
        {
          manifest: {
            contributes: {
              commands: [
                {
                  id: "plugin.command",
                  title: "Plugin Command",
                  category: "workspace",
                },
              ],
              keybindings: [{ id: "plugin.keybinding", commandId: "plugin.command", key: "mod+p" }],
            },
          },
        },
      ],
      pluginCatalog: {
        listSearchProviders: vi.fn(() => searchProviders),
        findLayoutContribution: vi.fn(() => layoutContribution),
        findWidgetContribution: vi.fn(() => undefined),
        findSearchContribution: vi.fn(() => searchContribution),
      },
      registryViews: {
        has: vi.fn(() => false),
        get: vi.fn(() => {
          throw new Error("unreachable")
        }),
      },
      instanceRepo: {
        save: vi.fn(async () => {}),
        remove: vi.fn(async () => {}),
      },
      pluginDataRepo: {
        getByInstance: vi.fn(),
        saveForInstance: vi.fn(),
      },
    },
    state: {
      workspace: vi.fn(() => ({
        id: "workspace-1",
        name: "默认工作区",
        activeLayoutId: "official.layout.workbench-dashboard",
        activeThemeId: "official.theme.light",
        activeBackgroundProviderId: "official.background.default",
        regions: {},
        createdAt: "2026-06-07T00:00:00.000Z",
        updatedAt: "2026-06-07T00:00:00.000Z",
      })),
      activeLayoutId: vi.fn(() => "official.layout.workbench-dashboard"),
      instances: vi.fn(() => [instance()]),
      expandState: vi.fn(() => null),
      contextMenu: vi.fn(() => null),
      dragState: vi.fn(() => null),
      searchSettings: vi.fn(() => searchSettings()),
      searchHistory: vi.fn((): SearchHistoryEntry[] => []),
      inlineSearchQuery: vi.fn(() => ""),
      inlineSearchOpen: vi.fn(() => false),
      inlineSearchActiveResultIndex: vi.fn(() => -1),
      commandPaletteOpen: vi.fn(() => true),
      isDark: vi.fn(() => false),
    },
    setters: {
      setInstances: vi.fn(),
      setExpandState: vi.fn(),
      setContextMenu: vi.fn(),
      setDragState: vi.fn(),
      setCommandPaletteOpen: vi.fn(),
      setAddWidgetOpen: vi.fn(),
      setInlineSearchQuery: vi.fn(),
      setInlineSearchOpen: vi.fn(),
      setInlineSearchActiveResultIndex: vi.fn(),
      setModalViewId: vi.fn(),
      setModalProps: vi.fn(),
    },
    actions: {
      openSettings: vi.fn(),
      showToast: vi.fn(),
      focusWidgetInstance: vi.fn(() => true),
    },
    controllers: {
      workspaceController: {
        switchTheme: vi.fn(),
        switchLayout: vi.fn(),
        setDefaultSearchProvider: vi.fn(),
        saveSearchHistory: vi.fn(async () => {}),
      },
      hostRuntime: {
        openExternalForPlugin: vi.fn(() => true),
      },
    },
  }
}

describe("createWorkbenchShellControllerRuntime", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("assembles command, widget, search, drag, and view runtimes with shared bridges", () => {
    const runtime = createWorkbenchShellControllerRuntime(options())

    expect(runtime.runCommand).toBe(runCommand)
    expect(runtime.shortcutRegistry).toBe(shortcutRegistry)
    expect(runtime.widgetController).toEqual(
      expect.objectContaining({
        widgetContribution,
        widgetRenderModel,
        buildSearchableWidgets,
      }),
    )
    expect(runtime.searchSurfaces).toEqual(
      expect.objectContaining({
        buildInlineSearchViewProps,
        buildCommandPaletteProps,
      }),
    )
    expect(runtime.dragHandlers).toEqual(
      expect.objectContaining({
        displayedInstances,
        onPointerDown,
        onPointerMove,
        onPointerUp,
        onPointerCancel,
        isDragging,
      }),
    )
    expect(runtime.viewRuntime).toEqual(
      expect.objectContaining({
        buildWidgetViewProps,
        instanceRenderer,
      }),
    )
  })

  it("wires the cross-runtime callback chain without leaving assembly in the app", async () => {
    const runtimeOptions = options()
    createWorkbenchShellControllerRuntime(runtimeOptions)

    expect(mocks.createWorkbenchShellCommandModels).toHaveBeenCalledTimes(1)
    expect(mocks.createWorkbenchWidgetController).toHaveBeenCalledTimes(1)
    expect(mocks.createWorkbenchSearchSurfaces).toHaveBeenCalledTimes(1)
    expect(mocks.createWorkbenchPointerDragHandlers).toHaveBeenCalledTimes(1)
    expect(mocks.createWorkbenchShellViewRuntime).toHaveBeenCalledTimes(1)

    const commandOptions = mocks.createWorkbenchShellCommandModels.mock.calls[0]![0] as Parameters<
      typeof createWorkbenchShellCommandModels
    >[0]
    expect(commandOptions.pluginCommands).toEqual([
      expect.objectContaining({ id: "plugin.command" }),
    ])
    expect(commandOptions.pluginKeybindings).toEqual([
      expect.objectContaining({ id: "plugin.keybinding" }),
    ])

    const widgetOptions = mocks.createWorkbenchWidgetController.mock.calls[0]![0] as Parameters<
      typeof createWorkbenchWidgetController
    >[0]
    const viewOptions = mocks.createWorkbenchShellViewRuntime.mock.calls[0]![0] as Parameters<
      typeof createWorkbenchShellViewRuntime
    >[0]
    const searchOptions = mocks.createWorkbenchSearchSurfaces.mock.calls[0]![0] as Parameters<
      typeof createWorkbenchSearchSurfaces
    >[0]
    const dragOptions = mocks.createWorkbenchPointerDragHandlers.mock.calls[0]![0] as Parameters<
      typeof createWorkbenchPointerDragHandlers
    >[0]

    const model: WidgetRenderModel = {
      title: "便签",
      icon: "pencil",
      currentSize: "M",
      supportedSizes: ["S", "M", "L"],
    }

    widgetOptions.buildWidgetViewProps(instance(), model)
    expect(buildWidgetViewProps).toHaveBeenCalledWith(instance(), model)

    searchOptions.getWidgets()
    expect(buildSearchableWidgets).toHaveBeenCalledTimes(1)
    expect(searchOptions.isCommandPaletteOpen()).toBe(true)

    await dragOptions.persistGridOrder([instance()])
    expect(persistGridOrder).toHaveBeenCalledWith([expect.objectContaining({ id: "widget-1" })])

    viewOptions.buildInlineSearchViewProps(instance({ extensionPoint: "search" }))
    expect(buildInlineSearchViewProps).toHaveBeenCalledWith(
      expect.objectContaining({ id: "widget-1" }),
    )

    viewOptions.widgetContribution(instance())
    viewOptions.widgetRenderModel(instance())
    viewOptions.onPointerDown({} as PointerEvent, "widget-1")
    viewOptions.onPointerMove({} as PointerEvent)
    viewOptions.onPointerUp({} as PointerEvent)
    viewOptions.onPointerCancel({} as PointerEvent)
    viewOptions.openWidgetExpand(instance())
    await viewOptions.changeWidgetSize("widget-1", "L" as WidgetSize)
    await viewOptions.removeWidget("widget-1")

    expect(widgetContribution).toHaveBeenCalledWith(expect.objectContaining({ id: "widget-1" }))
    expect(widgetRenderModel).toHaveBeenCalledWith(expect.objectContaining({ id: "widget-1" }))
    expect(onPointerDown).toHaveBeenCalledWith(expect.anything(), "widget-1")
    expect(onPointerMove).toHaveBeenCalledTimes(1)
    expect(onPointerUp).toHaveBeenCalledTimes(1)
    expect(onPointerCancel).toHaveBeenCalledTimes(1)
    expect(openWidgetExpand).toHaveBeenCalledWith(expect.objectContaining({ id: "widget-1" }))
    expect(changeWidgetSize).toHaveBeenCalledWith("widget-1", "L")
    expect(removeWidget).toHaveBeenCalledWith("widget-1")
  })
})
