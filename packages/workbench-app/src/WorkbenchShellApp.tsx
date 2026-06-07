import type { HostAdapter } from "@tabora/host-adapters"
import { onCleanup, Show } from "solid-js"
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
import { createWorkbenchShellHostRuntime } from "./WorkbenchShellHostRuntime"
import { renderWorkbenchWidgetIcon } from "./WorkbenchShellIcons"
import { createWorkbenchPointerDragHandlers } from "./WorkbenchShellDragState"
import { createWorkbenchShellLayoutRuntime } from "./WorkbenchShellLayoutRuntime"
import { focusWorkbenchWidgetInstance } from "./WorkbenchShellHostActions"
import {
  createWorkbenchSettingsPanelPropsBuilder,
  openWorkbenchSettings,
} from "./WorkbenchShellSettings"
import { createWorkbenchSearchSurfaces } from "./WorkbenchShellSearchSurfaces"
import { WorkbenchShellSurfaceHost } from "./WorkbenchShellSurfaceHost"
import { createWorkbenchShellSurfaceProps } from "./WorkbenchShellSurfaceProps"
import { createWorkbenchShellState } from "./WorkbenchShellState"
import { createWorkbenchShellViewRuntime } from "./WorkbenchShellViewRuntime"
import { resolveWorkbenchView } from "./WorkbenchShellViewBridge"
import { createWorkbenchWidgetController } from "./WorkbenchShellWidgetController"
import { createWorkbenchWorkspaceController } from "./WorkbenchShellWorkspaceController"
import { createWorkbenchShellCommandModels } from "./WorkbenchShellCommands"
import {
  type CommandExecutionContext,
  resolveDefaultProviderForSearch as resolveDefaultProviderId,
  resolveEnabledSearchProviders,
  resolveWidgetIconLabel,
  resolveWidgetRenderModel,
} from "./shellHelpers"
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

  const pluginCommands = plugins.flatMap((plugin) => plugin.manifest.contributes.commands ?? [])
  const pluginKeybindings = plugins.flatMap(
    (plugin) => plugin.manifest.contributes.keybindings ?? [],
  )

  const runPluginCommand = (_commandId: string, _context: CommandExecutionContext) => {
    // Plugin command execution is routed here so widget context stays available for the future bus.
  }
  const { availableCommandIds, commandItems, runCommand, shortcutRegistry } =
    createWorkbenchShellCommandModels({
      isDark,
      activeLayoutId,
      pluginCommands,
      pluginKeybindings,
      setCommandPaletteOpen: setCmdPaletteOpen,
      setAddWidgetOpen,
      openSettings,
      showToast,
      switchTheme: (themeId) => {
        void workspaceController.switchTheme(themeId)
      },
      switchLayout: (layoutId) => {
        void workspaceController.switchLayout(layoutId)
      },
      runPluginCommand,
    })

  const widgetController = createWorkbenchWidgetController({
    getWorkspace: workspaceState,
    getActiveLayoutId: activeLayoutId,
    getInstances: instances,
    getExpandState: expandState,
    getContextMenu: ctxMenu,
    setInstances,
    setExpandState,
    setContextMenu: setCtxMenu,
    resolveLayoutRegions: (layoutId) =>
      pluginCatalog.findLayoutContribution(layoutId)?.regions ?? [],
    resolveWidgetContribution: (pluginId, contributionId) =>
      pluginCatalog.findWidgetContribution(pluginId, contributionId),
    resolveWidgetRenderModel: (instance) =>
      resolveWidgetRenderModel(
        instance,
        pluginCatalog.findWidgetContribution(instance.pluginId, instance.contributionId),
      ),
    hasView: (viewId) => kernel.registry.views.has(viewId),
    buildWidgetViewProps: (instance, model) => viewRuntime.buildWidgetViewProps(instance, model),
    assignGridOrder,
    saveInstance: (instance) => instanceRepo.save(instance),
    removeInstance: (instanceId) => instanceRepo.remove(instanceId),
    showToast,
    focusWidgetInstance: focusWorkbenchWidgetInstance,
    availableCommandIds,
    runCommand,
  })

  const searchSurfaces = createWorkbenchSearchSurfaces({
    getProviders: () =>
      resolveEnabledSearchProviders(searchSettings(), pluginCatalog.listSearchProviders()),
    getDefaultProviderId: () =>
      resolveDefaultProviderId(searchSettings(), pluginCatalog.listSearchProviders()),
    getCommands: commandItems,
    getWidgets: () => widgetController.buildSearchableWidgets(),
    getHistory: searchHistory,
    getInlineSearchQuery: inlineSearchQuery,
    getInlineSearchOpen: inlineSearchOpen,
    getInlineSearchActiveResultIndex: inlineSearchActiveResultIndex,
    setInlineSearchQuery,
    setInlineSearchOpen,
    setInlineSearchActiveResultIndex,
    setDefaultProvider: workspaceController.setDefaultSearchProvider,
    saveHistory: workspaceController.saveSearchHistory,
    openExternalForPlugin: hostRuntime.openExternalForPlugin,
    openExternal: hostRuntime.openExternal,
    showToast,
    isCommandPaletteOpen: cmdPaletteOpen,
    closeCommandPalette: () => setCmdPaletteOpen(false),
  })

  const dragHandlers = createWorkbenchPointerDragHandlers({
    getPersistedInstances: instances,
    getDragState: dragState,
    setDragState,
    persistGridOrder: (orderedInstances) => widgetController.persistGridOrder(orderedInstances),
    showToast,
  })
  const viewRuntime = createWorkbenchShellViewRuntime({
    registryViews: kernel.registry.views,
    widgetContribution: (instance) => widgetController.widgetContribution(instance),
    widgetRenderModel: (instance) => widgetController.widgetRenderModel(instance),
    findSearchContribution: (pluginId, contributionId) =>
      pluginCatalog.findSearchContribution(pluginId, contributionId),
    buildInlineSearchViewProps: (instance) => searchSurfaces.buildInlineSearchViewProps(instance),
    renderWidgetIcon: renderWorkbenchWidgetIcon,
    onPointerDown: (event, instanceId) => dragHandlers.onPointerDown(event, instanceId),
    onPointerMove: (event) => dragHandlers.onPointerMove(event),
    onPointerUp: (event) => dragHandlers.onPointerUp(event),
    onPointerCancel: (event) => dragHandlers.onPointerCancel(event),
    openWidgetExpand: widgetController.openWidgetExpand,
    setContextMenu: setCtxMenu,
    changeWidgetSize: widgetController.changeWidgetSize,
    removeWidget: widgetController.removeWidget,
    isDragging: (instanceId) => dragHandlers.isDragging(instanceId),
    pluginDataRepo,
    saveInstance: (updated) => instanceRepo.save(updated),
    setInstances,
    setModalViewId,
    setModalProps,
    showToast,
    openExternalForPlugin: hostRuntime.openExternalForPlugin,
  })
  const layoutRuntime = createWorkbenchShellLayoutRuntime({
    activeLayoutId,
    isDark,
    setCommandPaletteOpen: setCmdPaletteOpen,
    setAddWidgetOpen,
    openSettings,
    switchLayout: workspaceController.switchLayout,
    switchTheme: workspaceController.switchTheme,
    runRailAction: hostRuntime.runRailAction,
    catalog: pluginCatalog,
    instanceRenderer: viewRuntime.instanceRenderer,
    displayedInstances: dragHandlers.displayedInstances,
    resolveLayoutView: (viewId) => resolveWorkbenchView(kernel.registry.views, viewId),
    isMobile: responsive.isMobile,
    clearLayoutError: () => layoutFallback.clearLayoutError(),
    recordLayoutError: (layoutId, error) => layoutFallback.recordLayoutError(layoutId, error),
    setContextMenu: setCtxMenu,
    widgetContribution: widgetController.widgetContribution,
    resolveWidgetModel: widgetController.widgetRenderModel,
    getWidgetView: (viewId) => resolveWorkbenchView<WidgetViewProps>(kernel.registry.views, viewId),
    renderWidgetIcon: renderWorkbenchWidgetIcon,
    buildWidgetViewProps: (instance, model) => viewRuntime.buildWidgetViewProps(instance, model),
    onPointerDown: (event, instanceId) => dragHandlers.onPointerDown(event, instanceId),
    onPointerMove: dragHandlers.onPointerMove,
    onPointerUp: dragHandlers.onPointerUp,
    onPointerCancel: dragHandlers.onPointerCancel,
    openWidgetExpand: widgetController.openWidgetExpand,
    changeWidgetSize: widgetController.changeWidgetSize,
    removeWidget: widgetController.removeWidget,
    isDragging: (instanceId) => dragHandlers.isDragging(instanceId),
  })

  void hostRuntime.initialize()

  const surfaceProps = createWorkbenchShellSurfaceProps({
    content: layoutRuntime.renderActiveLayout(),
    availableWidgets: pluginCatalog.listWidgetContributions(),
    widgetIconLabel: resolveWidgetIconLabel,
    addWidgetOpen: addWidgetOpen(),
    addWidget: widgetController.addWidget,
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
    getWidgetView: (viewId) => resolveWorkbenchView<WidgetViewProps>(kernel.registry.views, viewId),
    widgetIconForProps: (viewProps) =>
      renderWorkbenchWidgetIcon(widgetController.widgetContribution(viewProps)?.icon),
    closeExpand: widgetController.closeExpand,
    modalViewId: modalViewId(),
    modalProps: modalProps(),
    getModalView: (viewId) => resolveWorkbenchView(kernel.registry.views, viewId),
    closeModal: () => setModalViewId(null),
    fullscreenViewId: fullscreenViewId(),
    fullscreenProps: fullscreenProps(),
    getFullscreenView: (viewId) => resolveWorkbenchView(kernel.registry.views, viewId),
    closeFullscreen: () => setFullscreenViewId(null),
    contextMenu: ctxMenu(),
    contextSections: widgetController.buildContextMenuModel()?.sections,
    closeContextMenu: () => setCtxMenu(null),
    toasts: toasts(),
    runCommand,
    commandPalette: searchSurfaces.buildCommandPaletteProps(),
  })

  return (
    <div
      class="tabora-root"
      onKeyDown={(e) => {
        if (shortcutRegistry().executeKeydown(e)) {
          e.preventDefault()
        }
        if (e.key === "Escape") {
          widgetController.closeExpand()
          setCtxMenu(null)
          setAddWidgetOpen(false)
        }
      }}
      tabIndex={-1}
    >
      <Show when={kernelReady()} fallback={<div class="loading">Loading Tabora...</div>}>
        <WorkbenchShellSurfaceHost {...surfaceProps} />
      </Show>
    </div>
  )
}
