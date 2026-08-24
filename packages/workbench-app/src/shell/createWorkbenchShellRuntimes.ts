import { focusWorkbenchWidgetInstance } from "../runtime/WorkbenchShellHostActions"
import { createWorkbenchShellControllerRuntime } from "./WorkbenchShellControllerRuntime"
import { createWorkbenchShellLayoutRuntime } from "../layout/WorkbenchShellLayoutRuntime"
import type { WorkbenchShell } from "./WorkbenchShellContext"
import type { WorkbenchShellStateBundle } from "./WorkbenchShellState"
import type { WorkbenchRuntimeBootstrap } from "../runtime/bootstrap"
import type { createWorkbenchWorkspaceController } from "../workspace/WorkbenchShellWorkspaceController"
import type { createWorkbenchShellHostRuntime } from "../runtime/WorkbenchShellHostRuntime"
import type { createLayoutErrorTracker } from "../layout/layoutError"
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
  layoutError: ReturnType<typeof createLayoutErrorTracker>
  responsive: WorkbenchResponsiveState
  openSettings: (panelId?: string) => void
  showToast: WorkbenchShellStateBundle["runtime"]["showToast"]
}): WorkbenchShellRuntimes {
  const {
    state,
    runtime,
    workspaceController,
    hostRuntime,
    layoutError,
    responsive,
    openSettings,
    showToast,
  } = options

  const { catalog: pluginCatalog, kernel, repositories } = runtime
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
  const readLayoutState = <T = unknown>(key: string): T | undefined => {
    const layoutState = workspaceState()?.config?.layoutState
    if (!layoutState || typeof layoutState !== "object" || Array.isArray(layoutState)) {
      return undefined
    }
    return (layoutState as Record<string, T>)[key]
  }
  const writeLayoutState = (key: string, value: unknown) => {
    void workspaceController.updateWorkspace((workspace) => {
      const config = { ...(workspace.config ?? {}) } as Record<string, unknown>
      const current = config.layoutState
      const layoutState =
        current && typeof current === "object" && !Array.isArray(current)
          ? { ...(current as Record<string, unknown>) }
          : {}
      layoutState[key] = value
      config.layoutState = layoutState
      workspace.config = config
      return workspace
    })
  }

  const controllerWorkspaceActions = {
    switchTheme: async (themeId: string) => {
      const theme = pluginCatalog.listThemes().find((candidate) => candidate.id === themeId)
      if (theme) await workspaceController.switchTheme(theme.ref)
    },
    setDefaultSearchProvider: async (providerId: string) => {
      const provider = pluginCatalog
        .listSearchProviders()
        .find((candidate) => candidate.id === providerId)
      if (provider) await workspaceController.setDefaultSearchProvider(provider.ref)
    },
    saveSearchHistory: workspaceController.saveSearchHistory,
  }
  const controllerRuntime = createWorkbenchShellControllerRuntime({
    tShell: t,
    services: {
      plugins: kernel.plugins,
      pluginCatalog,
      registryViews: kernel.registry.views,
      registryCommands: kernel.registry.commands,
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
      workspaceController: controllerWorkspaceActions,
      hostRuntime,
    },
    isMobile: responsive.isMobile,
  })

  const layoutRuntime = createWorkbenchShellLayoutRuntime({
    activeLayoutId,
    layoutError: layoutError.status,
    isDark,
    tShell: t,
    shellConfig: runtime.shellConfig,
    setCommandPaletteOpen: setCmdPaletteOpen,
    setAddWidgetOpen,
    openSettings,
    readLayoutState,
    writeLayoutState,
    showToast,
    switchTheme: controllerWorkspaceActions.switchTheme,
    runRailAction: hostRuntime.runRailAction,
    catalog: pluginCatalog,
    instanceRenderer: controllerRuntime.viewRuntime.instanceRenderer,
    displayedInstances: controllerRuntime.dragHandlers.displayedInstances,
    isMobile: responsive.isMobile,
    clearLayoutError: layoutError.clearLayoutError,
    recordLayoutError: layoutError.recordLayoutError,
    dndKit: {
      onDragStart: controllerRuntime.dragHandlers.onDndDragStart,
      onDragMove: controllerRuntime.dragHandlers.onDndDragMove,
      onDragOver: controllerRuntime.dragHandlers.onDndDragOver,
      onDragEnd: controllerRuntime.dragHandlers.onDndDragEnd,
    },
  })

  return { controllerRuntime, layoutRuntime }
}
