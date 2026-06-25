import type {
  LayoutRegion,
  PluginInstance,
  WidgetContribution,
  WidgetSize,
  WidgetViewProps,
  Workspace,
} from "@tabora/plugin-api"
import type { ToastOptions } from "@tabora/orchestrator"

import {
  buildWorkbenchWidgetExpandState,
  buildWorkbenchWidgetInstanceSettingsState,
  resolveWorkbenchInstanceSettingsView,
  type WorkbenchExpandState,
} from "../surface/WorkbenchShellInteractions"
import type { ShellTranslation } from "../i18n"
import { persistWorkbenchGridOrder } from "../runtime/WorkbenchShellHostActions"
import {
  buildWorkbenchContextMenuModel,
  buildWorkbenchSearchableWidgets,
  findWorkbenchWidgetInstance,
} from "./WorkbenchShellWidgets"
import {
  addWorkbenchWidget,
  removeWorkbenchWidget,
  resizeWorkbenchWidget,
} from "./WorkbenchShellWidgetState"
import { requireWorkspace } from "../shared/WorkbenchShellUtils"
import type { WidgetRenderModel } from "../shared/shellHelpers"

type WidgetIdentity = Pick<PluginInstance, "pluginId" | "contributionId">
type WidgetContextMenuState = { x: number; y: number; instanceId: string } | null
type WidgetContributionLike = Pick<
  WidgetContribution,
  "contextMenus" | "defaultSize" | "icon" | "supportedSizes" | "title" | "views"
>

export function createWorkbenchWidgetController(options: {
  getWorkspace: () => Workspace | null
  getActiveLayoutId: () => string
  getInstances: () => PluginInstance[]
  getExpandState: () => WorkbenchExpandState | null
  getContextMenu: () => WidgetContextMenuState
  setInstances: (instances: PluginInstance[]) => void
  setExpandState: (state: WorkbenchExpandState | null) => void
  setContextMenu: (state: WidgetContextMenuState) => void
  resolveLayoutRegions: (layoutId: string) => LayoutRegion[]
  resolveWidgetContribution: (
    pluginId: string,
    contributionId: string,
  ) => WidgetContributionLike | undefined
  resolveWidgetRenderModel: (instance: PluginInstance) => WidgetRenderModel | null
  hasView: (viewId: string) => boolean
  buildWidgetViewProps: (instance: PluginInstance, model: WidgetRenderModel) => WidgetViewProps
  assignGridOrder: (instances: PluginInstance[]) => PluginInstance[]
  saveInstance: (instance: PluginInstance) => Promise<void>
  removeInstance: (instanceId: string) => Promise<void>
  showToast: (message: string, options?: ToastOptions) => void
  tShell?: ShellTranslation
  focusWidgetInstance: (instanceId: string) => boolean
  availableCommandIds: () => string[] | Set<string>
  runCommand: (commandId: string, context: { instance: PluginInstance }) => boolean
  requestAnimationFrame?: (callback: FrameRequestCallback) => number
}) {
  let lastExpandTrigger: HTMLElement | null = null

  const widgetContribution = (instance: WidgetIdentity) =>
    options.resolveWidgetContribution(instance.pluginId, instance.contributionId)

  const widgetRenderModel = (instance: PluginInstance): WidgetRenderModel | null =>
    options.resolveWidgetRenderModel(instance)

  const contextMenuContributions = (instance: PluginInstance) =>
    widgetContribution(instance)?.contextMenus ?? []

  async function addWidget(pluginId: string, contributionId: string, size?: WidgetSize) {
    const workspace = requireWorkspace(options.getWorkspace())
    const added = await addWorkbenchWidget({
      workspaceId: workspace.id,
      pluginId,
      contributionId,
      currentInstances: options.getInstances(),
      layoutRegions: options.resolveLayoutRegions(options.getActiveLayoutId()),
      resolveWidget: options.resolveWidgetContribution,
      assignGridOrder: options.assignGridOrder,
      saveInstance: options.saveInstance,
      setInstances: options.setInstances,
      ...(size ? { size } : {}),
    })

    if (!added) {
      options.showToast(options.tShell?.("widget.addNotSupported") ?? "当前布局不支持添加卡片", {
        type: "warning",
      })
    }
  }

  async function removeWidget(instanceId: string) {
    await removeWorkbenchWidget({
      instanceId,
      currentInstances: options.getInstances(),
      currentExpandInstanceId: options.getExpandState()?.instanceId ?? null,
      currentContextMenuInstanceId: options.getContextMenu()?.instanceId ?? null,
      clearExpand: closeExpand,
      clearContextMenu: () => options.setContextMenu(null),
      removeInstance: options.removeInstance,
      setInstances: options.setInstances,
    })
  }

  async function changeWidgetSize(instanceId: string, newSize: WidgetSize) {
    await resizeWorkbenchWidget({
      instanceId,
      newSize,
      currentInstances: options.getInstances(),
      saveInstance: options.saveInstance,
      setInstances: options.setInstances,
    })
  }

  function closeExpand() {
    options.setExpandState(null)
    if (lastExpandTrigger) {
      const scheduleFocus = options.requestAnimationFrame ?? requestAnimationFrame
      scheduleFocus(() => {
        lastExpandTrigger?.focus()
      })
    }
  }

  function openWidgetExpand(instance: PluginInstance, trigger?: HTMLElement) {
    const result = buildWorkbenchWidgetExpandState({
      instance,
      model: widgetRenderModel(instance),
      widget: widgetContribution(instance),
      hasView: options.hasView,
      buildWidgetViewProps: options.buildWidgetViewProps,
      ...(options.tShell ? { tShell: options.tShell } : {}),
    })

    if (!result.expandState) {
      if (result.errorMessage) options.showToast(result.errorMessage)
      return
    }

    lastExpandTrigger =
      trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
    options.setContextMenu(null)
    options.setExpandState(result.expandState)
  }

  function openWidgetInstanceSettings(instance: PluginInstance) {
    const result = buildWorkbenchWidgetInstanceSettingsState({
      instance,
      model: widgetRenderModel(instance),
      widget: widgetContribution(instance),
      hasView: options.hasView,
      buildWidgetViewProps: options.buildWidgetViewProps,
      ...(options.tShell ? { tShell: options.tShell } : {}),
    })

    if (!result.expandState) {
      if (result.errorMessage) options.showToast(result.errorMessage)
      return
    }

    lastExpandTrigger =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    options.setContextMenu(null)
    options.setExpandState(result.expandState)
  }

  function buildContextMenuModel() {
    return buildWorkbenchContextMenuModel({
      menu: options.getContextMenu(),
      instances: options.getInstances(),
      resolveWidgetRenderModel: widgetRenderModel,
      resolveContextMenus: contextMenuContributions,
      availableCommandIds: options.availableCommandIds(),
      runCommand: options.runCommand,
      hasInstanceSettings: (instance) =>
        resolveWorkbenchInstanceSettingsView(widgetContribution(instance), options.hasView) !==
        null,
      onResize: (instanceId, size) => {
        void changeWidgetSize(instanceId, size)
      },
      onExpand: (instanceId) => {
        const target = findWorkbenchWidgetInstance(options.getInstances(), instanceId)
        if (target) openWidgetExpand(target)
      },
      onOpenSettings: (instanceId) => {
        const target = findWorkbenchWidgetInstance(options.getInstances(), instanceId)
        if (target) openWidgetInstanceSettings(target)
      },
      onRemove: (instanceId) => {
        void removeWidget(instanceId)
        options.showToast(options.tShell?.("widget.instanceRemoved") ?? "实例已移除")
      },
    })
  }

  function buildSearchableWidgets() {
    return buildWorkbenchSearchableWidgets({
      instances: options.getInstances(),
      resolveWidgetContribution: options.resolveWidgetContribution,
      buildFocusAction: (instanceId) => () => {
        if (options.focusWidgetInstance(instanceId)) {
          options.showToast(options.tShell?.("widget.focused") ?? "已定位到对应卡片")
        }
      },
    })
  }

  async function persistGridOrder(orderedInstances: PluginInstance[]) {
    await persistWorkbenchGridOrder({
      currentInstances: options.getInstances(),
      orderedInstances,
      saveInstance: options.saveInstance,
      setInstances: options.setInstances,
    })
  }

  return {
    widgetContribution,
    widgetRenderModel,
    addWidget,
    removeWidget,
    changeWidgetSize,
    closeExpand,
    openWidgetExpand,
    openWidgetInstanceSettings,
    buildContextMenuModel,
    buildSearchableWidgets,
    persistGridOrder,
  }
}
