import type { HostAdapter } from "@tabora/host-adapters"
import { createEffect, createMemo, onCleanup, Show } from "solid-js"
import type {
  PluginInstance,
  WidgetViewProps,
  WorkbenchSearchSettings,
  Workspace,
} from "@tabora/plugin-api"
import { applyThemeTokens } from "@tabora/theme"

import type { WorkbenchRuntimeBootstrap } from "../runtime/bootstrap"
import { applyBackgroundStyle } from "../appearance/backgroundResolver"
import { createLayoutFallbackTracker } from "../layout/layoutFallback"
import { createWorkbenchResponsiveState } from "../shared/responsive"
import { createWorkbenchShellControllerRuntime } from "./WorkbenchShellControllerRuntime"
import { createWorkbenchShellHostRuntime } from "../runtime/WorkbenchShellHostRuntime"
import { renderWorkbenchWidgetIcon } from "../shared/WorkbenchShellIcons"
import { createWorkbenchShellLayoutRuntime } from "../layout/WorkbenchShellLayoutRuntime"
import { activePluginStyles, createPluginStyleManager } from "../shared/pluginStyleManager"
import {
  createWorkbenchSettingsPanelPropsBuilder,
  openWorkbenchSettings,
} from "../surface/WorkbenchShellSettings"
import { WorkbenchShellProvider, type WorkbenchShell } from "./WorkbenchShellContext"
import { WorkbenchShellSurfaceHost } from "../surface/WorkbenchShellSurfaceHost"
import { createWorkbenchShellState } from "./WorkbenchShellState"
import { resolveWorkbenchView } from "../shared/WorkbenchShellViewBridge"
import { createWorkbenchWorkspaceController } from "../workspace/WorkbenchShellWorkspaceController"
import { focusWorkbenchWidgetInstance } from "../runtime/WorkbenchShellHostActions"
import { assignGridOrder } from "../shared/workbenchGrid"

export type WorkbenchShellAppProps = {
  composition: {
    host: HostAdapter
    initialState: {
      workspace: Workspace | null
      instances: PluginInstance[]
      searchSettings: WorkbenchSearchSettings
    }
  }
  runtime: WorkbenchRuntimeBootstrap
}

export function WorkbenchShellApp(props: WorkbenchShellAppProps) {
  const composition = props.composition
  const runtime = props.runtime
  const state = createWorkbenchShellState({
    initialSearchSettings: composition.initialState.searchSettings,
    initialVisualState: {
      layoutId:
        composition.initialState.workspace?.activeLayoutId ??
        runtime.defaultWorkspacePreset.layoutId,
      themeId:
        composition.initialState.workspace?.activeThemeId ?? runtime.defaultWorkspacePreset.themeId,
      backgroundId:
        composition.initialState.workspace?.activeBackgroundProviderId ??
        runtime.defaultWorkspacePreset.backgroundProviderId,
    },
    darkThemeId: runtime.shellConfig.themeIds.dark,
  })
  const { kernelReady, setKernelReady, pluginRecords, setPluginRecords, showToast } = state.runtime
  const { workspaceState, setWorkspaceState, workspaceList, setWorkspaceList } = state.workspace
  const { activeLayoutId, setActiveLayoutId, setThemeId, setBackgroundId, isDark } =
    state.appearance
  const { instances, setInstances } = state.widgets
  // 仅保留 app 主体（controllers / effects / onKeyDown / openSettings / settings panel 装配）实际使用的
  // accessor/setter；纯供 surface 装配读取的 overlay 状态由 shell bundle 经 context 提供。
  const {
    setSettingsOpen,
    setActiveSettingsSectionId,
    setModalViewId,
    setModalProps,
    setFullscreenViewId,
    setFullscreenProps,
    expandState,
    setExpandState,
    dragState,
    setDragState,
    ctxMenu,
    setCtxMenu,
    setAddWidgetOpen,
    cmdPaletteOpen,
    setCmdPaletteOpen,
  } = state.overlays
  const {
    searchSettings,
    setSearchSettings,
    searchHistory,
    setSearchHistory,
    inlineSearchQuery,
    setInlineSearchQuery,
    inlineSearchOpen,
    setInlineSearchOpen,
    inlineSearchActiveResultIndex,
    setInlineSearchActiveResultIndex,
  } = state.search
  const responsive = createWorkbenchResponsiveState()
  const layoutFallback = createLayoutFallbackTracker({ notify: showToast })
  const { database, catalog: pluginCatalog, kernel, plugins, repositories } = runtime
  const { workspaceRepo, instanceRepo, pluginDataRepo, workspaceSnapshotRepo } = repositories
  const pluginStyleManager = createPluginStyleManager(document)
  const refreshPluginRecords = async () => {
    setPluginRecords(await repositories.pluginRecordRepo.getAll())
  }
  createEffect(() => {
    pluginStyleManager.apply(
      activePluginStyles({
        styles: runtime.pluginStyles,
        plugins,
        records: pluginRecords(),
      }),
    )
  })
  onCleanup(() => {
    pluginStyleManager.dispose()
  })
  const openSettings = (panelId?: string) =>
    openWorkbenchSettings(
      {
        panels: pluginCatalog.listSettingsPanels(),
        setActiveSettingsSectionId,
        setSettingsOpen,
      },
      panelId,
    )
  const workspaceController = createWorkbenchWorkspaceController({
    workspaceRepo,
    instanceRepo,
    pluginDataRepo,
    workspaceSnapshotRepo,
    database,
    kernel,
    pluginCatalog,
    getWorkspaceState: workspaceState,
    getInstances: instances,
    getSearchSettings: searchSettings,
    getSearchHistory: searchHistory,
    setWorkspaceState,
    setWorkspaceList,
    setActiveLayoutId,
    setSearchSettings,
    setSearchHistory,
    setInstances,
    setThemeId,
    setBackgroundId,
    applyTheme: (tokens) => applyThemeTokens(document.documentElement, tokens),
    applyBackground: applyBackgroundStyle,
    clearContextMenu: () => setCtxMenu(null),
    clearExpandState: () => setExpandState(null),
    defaultWorkspacePreset: runtime.defaultWorkspacePreset,
    shellConfig: runtime.shellConfig,
    assignGridOrder,
    syncPluginStyles: refreshPluginRecords,
  })
  const hostRuntime = createWorkbenchShellHostRuntime({
    runtime,
    hostPlatform: composition.host.platform,
    isDark,
    shellConfig: runtime.shellConfig,
    setAddWidgetOpen,
    openSettings,
    switchTheme: workspaceController.switchTheme,
    windowOpen: (url, target) => {
      window.open(url, target)
    },
    setPluginRecords,
    setKernelReady,
    setWorkspaceList,
    setWorkspaceState,
    setActiveLayoutId,
    setSearchSettings,
    setSearchHistory,
    setInstances,
    applyThemeSelection: workspaceController.applyThemeSelection,
    applyBackgroundSelection: workspaceController.applyBackgroundSelection,
    reconcileInstancesForLayout: workspaceController.reconcileInstancesForLayout,
    setModalViewId,
    setModalProps,
    setFullscreenViewId,
    setFullscreenProps,
    showToast,
  })
  onCleanup(hostRuntime.dispose)
  const buildSettingsPanelProps = createWorkbenchSettingsPanelPropsBuilder({
    getWorkspace: workspaceState,
    getWorkspaces: workspaceList,
    getLayouts: () => pluginCatalog.listLayouts(),
    getThemes: () => pluginCatalog.listThemes(),
    getBackgrounds: () => pluginCatalog.listBackgroundProviders(),
    getSearchProviders: () => pluginCatalog.listSearchProviders(),
    getSearchSettings: searchSettings,
    getPlugins: () => pluginCatalog.pluginSummaries(pluginRecords()),
    host: {
      close: () => setSettingsOpen(false),
      setDirty: () => {},
      switchLayout: workspaceController.switchLayout,
      switchTheme: workspaceController.switchTheme,
      switchBackground: workspaceController.switchBackground,
      setDefaultSearchProvider: workspaceController.setDefaultSearchProvider,
      setSearchProviderEnabled: workspaceController.setSearchProviderEnabled,
      togglePluginEnabled: workspaceController.togglePluginEnabled,
      exportWorkspace: workspaceController.exportWorkspace,
      importWorkspace: workspaceController.importWorkspace,
      createWorkspace: async (name) => {
        const ws = await workspaceController.createWorkspace(name)
        await workspaceController.switchWorkspace(ws.id)
      },
      switchWorkspace: workspaceController.switchWorkspace,
      deleteWorkspace: workspaceController.deleteWorkspace,
    },
  })

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
    setContextMenu: setCtxMenu,
    widgetContribution: controllerRuntime.widgetController.widgetContribution,
    resolveWidgetModel: controllerRuntime.widgetController.widgetRenderModel,
    getWidgetView: (viewId) => resolveWorkbenchView<WidgetViewProps>(kernel.registry.views, viewId),
    renderWidgetIcon: renderWorkbenchWidgetIcon,
    buildWidgetViewProps: (instance, model) =>
      controllerRuntime.viewRuntime.buildWidgetViewProps(instance, model),
    onPointerDown: (event, instanceId) =>
      controllerRuntime.dragHandlers.onPointerDown(event, instanceId),
    onPointerMove: controllerRuntime.dragHandlers.onPointerMove,
    onPointerUp: controllerRuntime.dragHandlers.onPointerUp,
    onPointerCancel: controllerRuntime.dragHandlers.onPointerCancel,
    openWidgetExpand: controllerRuntime.widgetController.openWidgetExpand,
    changeWidgetSize: controllerRuntime.widgetController.changeWidgetSize,
    removeWidget: controllerRuntime.widgetController.removeWidget,
    isDragging: (instanceId) => controllerRuntime.dragHandlers.isDragging(instanceId),
  })

  void hostRuntime.initialize()

  const layoutContent = createMemo(() => {
    kernelReady()
    return layoutRuntime.renderActiveLayout()
  })

  const shell: WorkbenchShell = {
    state,
    catalog: pluginCatalog,
    views: kernel.registry.views,
    controllerRuntime,
    buildSettingsPanelProps,
    layoutContent,
  }

  return (
    <WorkbenchShellProvider shell={shell}>
      <div
        class="tabora-root"
        onKeyDown={(e) => {
          if (controllerRuntime.shortcutRegistry().executeKeydown(e)) {
            e.preventDefault()
          }
          if (e.key === "Escape") {
            controllerRuntime.widgetController.closeExpand()
            setCtxMenu(null)
            setAddWidgetOpen(false)
          }
        }}
        tabIndex={-1}
      >
        <Show when={kernelReady()} fallback={<div class="loading">Loading Tabora...</div>}>
          <WorkbenchShellSurfaceHost />
        </Show>
      </div>
    </WorkbenchShellProvider>
  )
}
