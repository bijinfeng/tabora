import type { HostAdapter } from "@tabora/host-adapters"
import { createEffect, createMemo, onCleanup, Show } from "solid-js"
import type {
  PluginInstance,
  SettingsPanelViewProps,
  WidgetViewProps,
  WorkbenchSearchSettings,
  Workspace,
} from "@tabora/plugin-api"
import { applyThemeTokens } from "@tabora/theme"

import type { WorkbenchRuntimeBootstrap } from "./bootstrap"
import { applyBackgroundStyle } from "./backgroundResolver"
import { createLayoutFallbackTracker } from "./layoutFallback"
import { createWorkbenchResponsiveState } from "./responsive"
import { createWorkbenchShellControllerRuntime } from "./WorkbenchShellControllerRuntime"
import { createWorkbenchShellHostRuntime } from "./WorkbenchShellHostRuntime"
import { renderWorkbenchWidgetIcon } from "./WorkbenchShellIcons"
import { createWorkbenchShellLayoutRuntime } from "./WorkbenchShellLayoutRuntime"
import { activePluginStyles, createPluginStyleManager } from "./pluginStyleManager"
import {
  createWorkbenchSettingsPanelPropsBuilder,
  openWorkbenchSettings,
} from "./WorkbenchShellSettings"
import { WorkbenchShellSurfaceHost } from "./WorkbenchShellSurfaceHost"
import { createWorkbenchShellSurfaceProps } from "./WorkbenchShellSurfaceProps"
import { createWorkbenchShellState } from "./WorkbenchShellState"
import { resolveWorkbenchView } from "./WorkbenchShellViewBridge"
import { createWorkbenchWorkspaceController } from "./WorkbenchShellWorkspaceController"
import { focusWorkbenchWidgetInstance } from "./WorkbenchShellHostActions"
import { resolveWidgetIconLabel } from "./shellHelpers"
import { assignGridOrder } from "./workbenchGrid"

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
  const {
    kernelReady,
    setKernelReady,
    instances,
    setInstances,
    activeLayoutId,
    setActiveLayoutId,
    setThemeId,
    setBackgroundId,
    workspaceState,
    setWorkspaceState,
    workspaceList,
    setWorkspaceList,
    settingsOpen,
    setSettingsOpen,
    activeSettingsSectionId,
    setActiveSettingsSectionId,
    searchSettings,
    setSearchSettings,
    modalViewId,
    setModalViewId,
    modalProps,
    setModalProps,
    fullscreenViewId,
    setFullscreenViewId,
    fullscreenProps,
    setFullscreenProps,
    expandState,
    setExpandState,
    dragState,
    setDragState,
    ctxMenu,
    setCtxMenu,
    addWidgetOpen,
    setAddWidgetOpen,
    cmdPaletteOpen,
    setCmdPaletteOpen,
    pluginRecords,
    setPluginRecords,
    toasts,
    searchHistory,
    setSearchHistory,
    inlineSearchQuery,
    setInlineSearchQuery,
    inlineSearchOpen,
    setInlineSearchOpen,
    inlineSearchActiveResultIndex,
    setInlineSearchActiveResultIndex,
    isDark,
    showToast,
  } = createWorkbenchShellState({
    initialSearchSettings: composition.initialState.searchSettings,
  })
  const responsive = createWorkbenchResponsiveState()
  const layoutFallback = createLayoutFallbackTracker({ notify: showToast })
  const runtime = props.runtime
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
    assignGridOrder,
    syncPluginStyles: refreshPluginRecords,
  })
  const hostRuntime = createWorkbenchShellHostRuntime({
    runtime,
    hostPlatform: composition.host.platform,
    isDark,
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

  const surfaceProps = createMemo(() => {
    return createWorkbenchShellSurfaceProps({
      content: layoutContent(),
      availableWidgets: pluginCatalog.listWidgetContributions(),
      widgetIconLabel: resolveWidgetIconLabel,
      addWidgetOpen: addWidgetOpen(),
      addWidget: controllerRuntime.widgetController.addWidget,
      closeAddWidget: () => setAddWidgetOpen(false),
      settingsOpen: settingsOpen(),
      settingsPanels: pluginCatalog.listSettingsPanels(),
      activeSettingsSectionId: activeSettingsSectionId(),
      onSettingsSectionChange: setActiveSettingsSectionId,
      closeSettings: () => setSettingsOpen(false),
      getSettingsView: (viewId) =>
        resolveWorkbenchView<SettingsPanelViewProps>(kernel.registry.views, viewId),
      buildSettingsPanelProps,
      workspaceName: workspaceState()?.name ?? "未加载",
      enabledPluginCount: pluginCatalog
        .pluginSummaries(pluginRecords())
        .filter((plugin) => plugin.enabled).length,
      expandState: expandState(),
      getWidgetView: (viewId) =>
        resolveWorkbenchView<WidgetViewProps>(kernel.registry.views, viewId),
      widgetIconForProps: (viewProps) =>
        renderWorkbenchWidgetIcon(
          controllerRuntime.widgetController.widgetContribution(viewProps)?.icon,
        ),
      closeExpand: controllerRuntime.widgetController.closeExpand,
      modalViewId: modalViewId(),
      modalProps: modalProps(),
      getModalView: (viewId) => resolveWorkbenchView(kernel.registry.views, viewId),
      closeModal: () => setModalViewId(null),
      fullscreenViewId: fullscreenViewId(),
      fullscreenProps: fullscreenProps(),
      getFullscreenView: (viewId) => resolveWorkbenchView(kernel.registry.views, viewId),
      closeFullscreen: () => setFullscreenViewId(null),
      contextMenu: ctxMenu(),
      contextSections: controllerRuntime.widgetController.buildContextMenuModel()?.sections,
      closeContextMenu: () => setCtxMenu(null),
      toasts: toasts(),
      runCommand: controllerRuntime.runCommand,
      commandPalette: controllerRuntime.searchSurfaces.buildCommandPaletteProps(),
    })
  })

  return (
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
        <WorkbenchShellSurfaceHost {...surfaceProps()} />
      </Show>
    </div>
  )
}
