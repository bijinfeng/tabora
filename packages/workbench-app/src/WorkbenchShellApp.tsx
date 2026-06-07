import type { HostAdapter } from "@tabora/host-adapters"
import { onCleanup, Show } from "solid-js"
import type {
  PluginInstance,
  SettingsPanelViewProps,
  WidgetViewProps,
  WorkbenchSearchSettings,
  Workspace,
} from "@tabora/plugin-api"
import { createLayoutEngine } from "@tabora/orchestrator"
import { applyThemeTokens } from "@tabora/theme"

import type { WorkbenchRuntimeBootstrap } from "./bootstrap"
import { applyBackgroundStyle } from "./backgroundResolver"
import { createLayoutFallbackTracker } from "./layoutFallback"
import { createWorkbenchResponsiveState } from "./responsive"
import { renderWorkbenchWidgetIcon } from "./WorkbenchShellIcons"
import { createWorkbenchInstanceRenderer } from "./WorkbenchShellInstanceRenderer"
import { createWorkbenchLayoutHostAPI } from "./WorkbenchShellLayoutHost"
import { createWorkbenchLayoutRenderer } from "./WorkbenchShellLayoutRenderer"
import { createWorkbenchPointerDragHandlers } from "./WorkbenchShellDragState"
import { focusWorkbenchWidgetInstance, runWorkbenchRailAction } from "./WorkbenchShellHostActions"
import {
  initializeWorkbenchShellRuntime,
  wireWorkbenchRuntimeEvents,
} from "./WorkbenchShellRuntimeState"
import {
  createWorkbenchSettingsPanelPropsBuilder,
  openWorkbenchSettings,
} from "./WorkbenchShellSettings"
import { createWorkbenchSearchSurfaces } from "./WorkbenchShellSearchSurfaces"
import { WorkbenchShellSurfaceHost } from "./WorkbenchShellSurfaceHost"
import { createWorkbenchShellState } from "./WorkbenchShellState"
import { buildWorkbenchWidgetViewProps, resolveWorkbenchView } from "./WorkbenchShellViewBridge"
import { createWorkbenchWidgetController } from "./WorkbenchShellWidgetController"
import { createWorkbenchWorkspaceController } from "./WorkbenchShellWorkspaceController"
import { WorkbenchSettingsAboutContent } from "./WorkbenchShellChrome"
import { createWorkbenchShellCommandModels } from "./WorkbenchShellCommands"
import { canPluginOpenExternal } from "./shellController"
import {
  type CommandExecutionContext,
  resolveDefaultProviderForSearch as resolveDefaultProviderId,
  resolveEnabledSearchProviders,
  resolveWidgetIconLabel,
  resolveWidgetRenderModel,
  type WidgetRenderModel,
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
    buildWidgetViewProps: (instance, model) => buildWidgetViewProps(instance, model),
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
    openExternalForPlugin: (pluginId, url) => openExternalForPlugin(pluginId, url),
    openExternal: (url) => openExternal(url),
    showToast,
    isCommandPaletteOpen: cmdPaletteOpen,
    closeCommandPalette: () => setCmdPaletteOpen(false),
  })

  const instanceRenderer = createWorkbenchInstanceRenderer({
    registryViews: kernel.registry.views,
    widgetContribution: (instance) => widgetController.widgetContribution(instance),
    widgetRenderModel: (instance) => widgetController.widgetRenderModel(instance),
    findSearchContribution: (pluginId, contributionId) =>
      pluginCatalog.findSearchContribution(pluginId, contributionId),
    buildWidgetViewProps: (instance, model) => buildWidgetViewProps(instance, model),
    buildSearchViewProps: (instance) => searchSurfaces.buildInlineSearchViewProps(instance),
    renderWidgetIcon: renderWorkbenchWidgetIcon,
    onPointerDown: (event, instanceId) => dragHandlers.onPointerDown(event, instanceId),
    onPointerMove: (event) => dragHandlers.onPointerMove(event),
    onPointerUp: (event) => dragHandlers.onPointerUp(event),
    onPointerCancel: (event) => dragHandlers.onPointerCancel(event),
    onOpenWidgetExpand: widgetController.openWidgetExpand,
    onOpenWidgetContextMenu: (event, instanceId) => {
      event.preventDefault()
      setCtxMenu({ x: event.clientX, y: event.clientY, instanceId })
    },
    onChangeWidgetSize: (instanceId, size) => {
      void widgetController.changeWidgetSize(instanceId, size)
    },
    onRemoveWidget: (instanceId) => {
      void widgetController.removeWidget(instanceId)
    },
    isDragging: (instanceId) => dragHandlers.isDragging(instanceId),
  })

  const layoutHostAPI = createWorkbenchLayoutHostAPI({
    activeLayoutId,
    isDark,
    setCommandPaletteOpen: setCmdPaletteOpen,
    setAddWidgetOpen,
    openSettings,
    switchLayout: (layoutId) => {
      void workspaceController.switchLayout(layoutId)
    },
    switchTheme: (themeId) => {
      void workspaceController.switchTheme(themeId)
    },
    runRailAction: (actionId) => runRailAction(actionId),
  })

  // Create layout engine
  const layoutEngine = createLayoutEngine({
    catalog: pluginCatalog,
    instanceRenderer,
    hostActions: layoutHostAPI,
  })

  const buildWidgetViewProps = (instance: PluginInstance, model: WidgetRenderModel) =>
    buildWorkbenchWidgetViewProps({
      instance,
      model,
      pluginDataRepo,
      saveInstance: (updated) => instanceRepo.save(updated),
      setInstances,
      removeWidget: widgetController.removeWidget,
      changeWidgetSize: widgetController.changeWidgetSize,
      setModalViewId,
      setModalProps,
      openWidgetExpand: widgetController.openWidgetExpand,
      showToast,
      openExternalForPlugin,
    })

  const dragHandlers = createWorkbenchPointerDragHandlers({
    getPersistedInstances: instances,
    getDragState: dragState,
    setDragState,
    persistGridOrder: (orderedInstances) => widgetController.persistGridOrder(orderedInstances),
    showToast,
  })

  const layoutRenderer = createWorkbenchLayoutRenderer({
    activeLayoutId,
    displayedInstances: dragHandlers.displayedInstances,
    findLayoutContribution: (layoutId) => pluginCatalog.findLayoutContribution(layoutId),
    resolveLayoutView: (viewId) => resolveWorkbenchView(kernel.registry.views, viewId),
    buildRegionSlots: (layoutId, currentInstances) =>
      layoutEngine.buildRegionSlots(layoutId, currentInstances),
    buildHostAPI: () => layoutEngine.buildHostAPI(),
    isMobile: responsive.isMobile,
    clearLayoutError: () => layoutFallback.clearLayoutError(),
    recordLayoutError: (layoutId, error) => layoutFallback.recordLayoutError(layoutId, error),
    safeLayout: {
      isDark,
      instances: dragHandlers.displayedInstances,
      widgetContribution: widgetController.widgetContribution,
      resolveWidgetModel: widgetController.widgetRenderModel,
      getView: (viewId) => resolveWorkbenchView<WidgetViewProps>(kernel.registry.views, viewId),
      renderWidgetIcon: renderWorkbenchWidgetIcon,
      buildWidgetViewProps: (instance, model) => buildWidgetViewProps(instance, model),
      onOpenCommandPalette: () => setCmdPaletteOpen(true),
      onToggleTheme: () =>
        void workspaceController.switchTheme(
          isDark() ? "official.theme.light" : "official.theme.dark",
        ),
      onOpenSettings: () => openSettings(),
      onPointerDown: (event, instanceId) => dragHandlers.onPointerDown(event, instanceId),
      onPointerMove: dragHandlers.onPointerMove,
      onPointerUp: dragHandlers.onPointerUp,
      onPointerCancel: dragHandlers.onPointerCancel,
      onOpenExpand: widgetController.openWidgetExpand,
      onOpenContextMenu: (event, instanceId) => {
        event.preventDefault()
        setCtxMenu({ x: event.clientX, y: event.clientY, instanceId })
      },
      onResize: (instanceId, size) => {
        void widgetController.changeWidgetSize(instanceId, size)
      },
      onRemove: (instanceId) => {
        void widgetController.removeWidget(instanceId)
      },
      isDragging: (instanceId) => dragHandlers.isDragging(instanceId),
    },
  })

  const openExternalForPlugin = (pluginId: string, url: string): boolean =>
    canPluginOpenExternal({ pluginId, url, plugins: kernel.plugins }) && openExternal(url)

  const openExternal = (url: string): boolean => (
    kernel.events.emit("host.external.open", { url }),
    true
  )

  const runRailAction = (actionId: string) =>
    runWorkbenchRailAction(actionId, {
      platform: composition.host.platform,
      onAddWidget: () => setAddWidgetOpen(true),
      onToggleTheme: () => {
        void workspaceController.switchTheme(
          isDark() ? "official.theme.light" : "official.theme.dark",
        )
      },
      onOpenSettings: () => openSettings("official.settings.workspace.appearance"),
    })

  const disposeRuntimeEvents = wireWorkbenchRuntimeEvents({
    runtime,
    setModalViewId,
    setModalProps,
    setFullscreenViewId,
    setFullscreenProps,
    showToast,
    openExternal: (url) => {
      window.open(url, "_blank")
    },
  })
  onCleanup(disposeRuntimeEvents)

  void initializeWorkbenchShellRuntime({
    runtime,
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
        <WorkbenchShellSurfaceHost
          content={layoutRenderer.renderActiveLayout()}
          addWidgetModal={{
            open: addWidgetOpen(),
            availableWidgets: pluginCatalog.listWidgetContributions(),
            widgetIconLabel: resolveWidgetIconLabel,
            onAdd: (pluginId, widgetId) => {
              void widgetController.addWidget(pluginId, widgetId)
              setAddWidgetOpen(false)
            },
            onClose: () => setAddWidgetOpen(false),
          }}
          settingsHost={{
            open: settingsOpen(),
            panels: pluginCatalog.listSettingsPanels(),
            activeSectionId: activeSettingsSectionId(),
            onSectionChange: setActiveSettingsSectionId,
            onClose: () => setSettingsOpen(false),
            getView: (viewId) =>
              resolveWorkbenchView<SettingsPanelViewProps>(kernel.registry.views, viewId),
            panelProps: buildSettingsPanelProps,
            aboutContent: (
              <WorkbenchSettingsAboutContent
                workspaceName={workspaceState()?.name ?? "未加载"}
                enabledPluginCount={
                  pluginCatalog.pluginSummaries(pluginRecords()).filter((plugin) => plugin.enabled)
                    .length
                }
              />
            ),
          }}
          expandOverlay={{
            expandState: expandState(),
            getView: (viewId) =>
              resolveWorkbenchView<WidgetViewProps>(kernel.registry.views, viewId),
            widgetIconForProps: (viewProps) =>
              renderWorkbenchWidgetIcon(widgetController.widgetContribution(viewProps)?.icon),
            onClose: widgetController.closeExpand,
          }}
          pluginModal={{
            viewId: modalViewId(),
            modalProps: modalProps(),
            getView: (viewId) => resolveWorkbenchView(kernel.registry.views, viewId),
            onClose: () => setModalViewId(null),
          }}
          fullscreenOverlay={{
            viewId: fullscreenViewId(),
            fullscreenProps: fullscreenProps(),
            getView: (viewId) => resolveWorkbenchView(kernel.registry.views, viewId),
            onClose: () => setFullscreenViewId(null),
          }}
          contextMenuOverlay={{
            menu: ctxMenu(),
            sections: widgetController.buildContextMenuModel()?.sections ?? [],
            onClose: () => setCtxMenu(null),
          }}
          toastHost={{
            toasts: toasts(),
            onAction: (commandId) => runCommand(commandId, {}),
          }}
          commandPalette={searchSurfaces.buildCommandPaletteProps()}
        />
      </Show>
    </div>
  )
}
