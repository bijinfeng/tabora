import type { WidgetViewProps } from "@tabora/plugin-api"

import { renderWorkbenchWidgetIcon } from "../shared/WorkbenchShellIcons"
import { resolveWorkbenchView } from "../shared/WorkbenchShellViewBridge"
import { focusWorkbenchWidgetInstance } from "../runtime/WorkbenchShellHostActions"
import { createWorkbenchShellControllerRuntime } from "./WorkbenchShellControllerRuntime"
import { createWorkbenchShellLayoutRuntime } from "../layout/WorkbenchShellLayoutRuntime"
import type { WorkbenchShell } from "./WorkbenchShellContext"
import type { WorkbenchShellStateBundle } from "./WorkbenchShellState"
import type { WorkbenchRuntimeBootstrap } from "../runtime/bootstrap"
import type { createWorkbenchWorkspaceController } from "../workspace/WorkbenchShellWorkspaceController"
import type { createWorkbenchShellHostRuntime } from "../runtime/WorkbenchShellHostRuntime"
import type { createLayoutFallbackTracker } from "../layout/layoutFallback"
import type { WorkbenchResponsiveState } from "../shared/responsive"
import {
  createWorkbenchShellCommandPaletteCopy,
  createWorkbenchShellPluginViewBoundaryCopy,
  createWorkbenchShellWidgetCopy,
} from "../i18n"

export type WorkbenchShellRuntimes = Pick<WorkbenchShell, "controllerRuntime"> & {
  layoutRuntime: ReturnType<typeof createWorkbenchShellLayoutRuntime>
}

export function createWorkbenchShellRuntimes(options: {
  state: WorkbenchShellStateBundle
  runtime: WorkbenchRuntimeBootstrap
  workspaceController: ReturnType<typeof createWorkbenchWorkspaceController>
  hostRuntime: ReturnType<typeof createWorkbenchShellHostRuntime>
  layoutFallback: ReturnType<typeof createLayoutFallbackTracker>
  responsive: WorkbenchResponsiveState
  openSettings: (panelId?: string) => void
  showToast: WorkbenchShellStateBundle["runtime"]["showToast"]
}): WorkbenchShellRuntimes {
  const {
    state,
    runtime,
    workspaceController,
    hostRuntime,
    layoutFallback,
    responsive,
    openSettings,
    showToast,
  } = options

  const { plugins, catalog: pluginCatalog, kernel, repositories } = runtime
  const { instanceRepo, pluginDataRepo } = repositories
  const t = (key: string, vars?: Record<string, string | number>) =>
    runtime.i18n.t("tabora.shell", key, vars)

  const { appearance, widgets, overlays, search } = state
  const { activeLayoutId, isDark } = appearance
  const { instances, setInstances } = widgets
  const {
    expandState,
    setExpandState,
    dragState,
    setDragState,
    ctxMenu,
    setCtxMenu,
    setAddWidgetOpen,
    cmdPaletteOpen,
    setCmdPaletteOpen,
    setModalViewId,
    setModalProps,
  } = overlays
  const {
    searchSettings,
    searchHistory,
    inlineSearchQuery,
    setInlineSearchQuery,
    inlineSearchOpen,
    setInlineSearchOpen,
    inlineSearchActiveResultIndex,
    setInlineSearchActiveResultIndex,
  } = search
  const { workspaceState } = state.workspace

  const controllerRuntime = createWorkbenchShellControllerRuntime({
    services: {
      plugins,
      pluginCatalog,
      registryViews: kernel.registry.views,
      instanceRepo,
      pluginDataRepo,
    },
    state: {
      workspace: workspaceState,
      activeLayoutId,
      instances,
      expandState,
      contextMenu: ctxMenu,
      dragState,
      searchSettings,
      searchHistory,
      inlineSearchQuery,
      inlineSearchOpen,
      inlineSearchActiveResultIndex,
      commandPaletteOpen: cmdPaletteOpen,
      isDark,
    },
    shellConfig: runtime.shellConfig,
    setters: {
      setInstances,
      setExpandState,
      setContextMenu: setCtxMenu,
      setDragState,
      setCommandPaletteOpen: setCmdPaletteOpen,
      setAddWidgetOpen,
      setInlineSearchQuery,
      setInlineSearchOpen,
      setInlineSearchActiveResultIndex,
      setModalViewId,
      setModalProps,
    },
    actions: {
      openSettings,
      showToast,
      focusWidgetInstance: focusWorkbenchWidgetInstance,
    },
    copy: {
      getCommandPaletteCopy: () => createWorkbenchShellCommandPaletteCopy(t),
      widgetShellCopy: createWorkbenchShellWidgetCopy(t),
      pluginViewBoundaryCopy: createWorkbenchShellPluginViewBoundaryCopy(t),
    },
    controllers: {
      workspaceController,
      hostRuntime,
    },
  })

  const layoutRuntime = createWorkbenchShellLayoutRuntime({
    activeLayoutId,
    failedLayoutId: () => layoutFallback.status()?.layoutId ?? null,
    isDark,
    shellConfig: runtime.shellConfig,
    setCommandPaletteOpen: setCmdPaletteOpen,
    setAddWidgetOpen,
    openSettings,
    showToast,
    switchLayout: workspaceController.switchLayout,
    switchTheme: workspaceController.switchTheme,
    runRailAction: hostRuntime.runRailAction,
    catalog: pluginCatalog,
    instanceRenderer: controllerRuntime.viewRuntime.instanceRenderer,
    displayedInstances: controllerRuntime.dragHandlers.displayedInstances,
    resolveLayoutView: (viewId) => resolveWorkbenchView(kernel.registry.views, viewId),
    isMobile: responsive.isMobile,
    clearLayoutError: () => layoutFallback.clearLayoutError(),
    recordLayoutError: (layoutId, error) => layoutFallback.recordLayoutError(layoutId, error),
    dndKit: {
      onDragStart: controllerRuntime.dragHandlers.onDndDragStart,
      onDragMove: controllerRuntime.dragHandlers.onDndDragMove,
      onDragOver: controllerRuntime.dragHandlers.onDndDragOver,
      onDragEnd: controllerRuntime.dragHandlers.onDndDragEnd,
    },
    setContextMenu: setCtxMenu,
    widgetContribution: controllerRuntime.widgetController.widgetContribution,
    resolveWidgetModel: controllerRuntime.widgetController.widgetRenderModel,
    getWidgetView: (viewId) => resolveWorkbenchView<WidgetViewProps>(kernel.registry.views, viewId),
    renderWidgetIcon: renderWorkbenchWidgetIcon,
    buildWidgetViewProps: (instance, model) =>
      controllerRuntime.viewRuntime.buildWidgetViewProps(instance, model),
    openWidgetExpand: controllerRuntime.widgetController.openWidgetExpand,
    changeWidgetSize: controllerRuntime.widgetController.changeWidgetSize,
    removeWidget: controllerRuntime.widgetController.removeWidget,
    isDragging: (instanceId) => controllerRuntime.dragHandlers.isDragging(instanceId),
  })

  return { controllerRuntime, layoutRuntime }
}
