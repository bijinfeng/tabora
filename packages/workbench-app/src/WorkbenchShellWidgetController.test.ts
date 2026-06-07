import type {
  LayoutRegion,
  PluginInstance,
  WidgetContribution,
  WidgetViewProps,
  Workspace,
} from "@tabora/plugin-api"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createWorkbenchWidgetController } from "./WorkbenchShellWidgetController"
import type { WorkbenchExpandState } from "./WorkbenchShellInteractions"
import type { WidgetRenderModel } from "./shellHelpers"

const baseDate = "2026-06-07T00:00:00.000Z"

function workspace(): Workspace {
  return {
    id: "workspace-1",
    name: "默认工作区",
    activeLayoutId: "official.layout.workbench-dashboard",
    activeThemeId: "official.theme.light",
    activeBackgroundProviderId: "official.background.default",
    regions: {},
    createdAt: baseDate,
    updatedAt: baseDate,
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

function widgetContribution(
  overrides: Partial<WidgetContribution> = {},
): Pick<
  WidgetContribution,
  "contextMenus" | "defaultSize" | "icon" | "supportedSizes" | "title" | "views"
> {
  return {
    title: "便签",
    icon: "pencil",
    supportedSizes: ["S", "M", "L"],
    defaultSize: "M",
    views: {
      card: "widget.notes.card",
      expand: "widget.notes.expand",
      settings: "widget.notes.settings",
    },
    contextMenus: [],
    ...overrides,
  }
}

function renderModel(): WidgetRenderModel {
  return {
    title: "便签",
    icon: "pencil",
    currentSize: "M",
    supportedSizes: ["S", "M", "L"],
  }
}

function viewProps(): WidgetViewProps {
  return {
    instanceId: "widget-1",
    pluginId: "plugin.widgets",
    contributionId: "widget.notes",
    size: "M",
    supportedSizes: ["S", "M", "L"],
    config: {},
    data: {
      get: async () => undefined,
      save: async () => {},
    },
    host: {
      updateConfig: async () => {},
      removeInstance: async () => {},
      requestResize: async () => {},
      openModal: () => {},
      closeModal: () => {},
      openExpand: () => {},
      showToast: () => {},
      openExternal: async () => false,
    },
  }
}

function createController(options: {
  layoutRegions?: LayoutRegion[]
  instances?: PluginInstance[]
  focusWidgetInstance?: (instanceId: string) => boolean
}) {
  let currentInstances = options.instances ?? [instance()]
  let currentExpandState: WorkbenchExpandState | null = null
  let currentContextMenu: { x: number; y: number; instanceId: string } | null = {
    x: 10,
    y: 20,
    instanceId: "widget-1",
  }

  const setInstances = vi.fn((next: PluginInstance[]) => {
    currentInstances = next
  })
  const setExpandState = vi.fn((next: WorkbenchExpandState | null) => {
    currentExpandState = next
  })
  const setContextMenu = vi.fn((next: { x: number; y: number; instanceId: string } | null) => {
    currentContextMenu = next
  })
  const saveInstance = vi.fn(async () => {})
  const removeInstance = vi.fn(async () => {})
  const showToast = vi.fn()
  const focusWidgetInstance = vi.fn(options.focusWidgetInstance ?? (() => false))

  const controller = createWorkbenchWidgetController({
    getWorkspace: () => workspace(),
    getActiveLayoutId: () => "official.layout.workbench-dashboard",
    getInstances: () => currentInstances,
    getExpandState: () => currentExpandState,
    getContextMenu: () => currentContextMenu,
    setInstances,
    setExpandState,
    setContextMenu,
    resolveLayoutRegions: () => options.layoutRegions ?? [],
    resolveWidgetContribution: () => widgetContribution(),
    resolveWidgetRenderModel: () => renderModel(),
    hasView: () => true,
    buildWidgetViewProps: () => viewProps(),
    assignGridOrder: (instances) => instances,
    saveInstance,
    removeInstance,
    showToast,
    focusWidgetInstance,
    availableCommandIds: () => [],
    runCommand: () => false,
  })

  return {
    controller,
    setInstances,
    setExpandState,
    setContextMenu,
    saveInstance,
    removeInstance,
    showToast,
    focusWidgetInstance,
    getInstances: () => currentInstances,
    getExpandState: () => currentExpandState,
    getContextMenu: () => currentContextMenu,
  }
}

describe("createWorkbenchWidgetController", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("shows a warning instead of guessing a widget region when the active layout has none", async () => {
    const { controller, saveInstance, setInstances, showToast } = createController({
      layoutRegions: [{ id: "toolbar", title: "Toolbar", accepts: ["search"], required: false }],
    })

    await controller.addWidget("plugin.widgets", "widget.notes")

    expect(saveInstance).not.toHaveBeenCalled()
    expect(setInstances).not.toHaveBeenCalled()
    expect(showToast).toHaveBeenCalledWith("当前布局不支持添加卡片", { type: "warning" })
  })

  it("opens widget expand state and clears the active context menu", () => {
    const { controller, getExpandState, getContextMenu, setExpandState, setContextMenu } =
      createController({
        layoutRegions: [{ id: "mainGrid", title: "Grid", accepts: ["widget"], required: false }],
      })

    controller.openWidgetExpand(instance())

    expect(setContextMenu).toHaveBeenCalledWith(null)
    expect(setExpandState).toHaveBeenCalled()
    expect(getContextMenu()).toBeNull()
    expect(getExpandState()).toMatchObject({
      instanceId: "widget-1",
      title: "便签",
      viewId: "widget.notes.expand",
      mode: "expand",
    })
  })

  it("builds searchable widget actions that focus the instance and show a toast", () => {
    const { controller, focusWidgetInstance, showToast } = createController({
      focusWidgetInstance: () => true,
    })

    const entries = controller.buildSearchableWidgets()
    expect(entries).toHaveLength(1)

    entries[0]?.action()

    expect(focusWidgetInstance).toHaveBeenCalledWith("widget-1")
    expect(showToast).toHaveBeenCalledWith("已定位到对应卡片")
  })
})
