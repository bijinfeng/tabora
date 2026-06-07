import type { HostAdapter } from "@tabora/host-adapters"
import { createSignal, onCleanup, Show } from "solid-js"
import type {
  PluginInstance,
  PluginRecord,
  SearchHistoryEntry,
  SettingsPanelViewProps,
  WidgetViewProps,
  WorkbenchSearchSettings,
  Workspace,
} from "@tabora/plugin-api"
import {
  createLayoutEngine,
  createToastManager,
  type LayoutSwitchPlan,
  type ToastOptions,
  type ToastRecord,
} from "@tabora/orchestrator"
import { applyThemeTokens } from "@tabora/theme"
import { LayoutBoundary, type SettingsSectionId } from "@tabora/workbench-shell"

import type { WorkbenchRuntimeBootstrap } from "./bootstrap"
import { applyBackgroundStyle, FALLBACK_BACKGROUND_ID } from "./backgroundResolver"
import { createLayoutFallbackTracker } from "./layoutFallback"
import { createWorkbenchResponsiveState } from "./responsive"
import { renderWorkbenchWidgetIcon } from "./WorkbenchShellIcons"
import { type WorkbenchExpandState } from "./WorkbenchShellInteractions"
import { createWorkbenchInstanceRenderer } from "./WorkbenchShellInstanceRenderer"
import { createWorkbenchLayoutHostAPI } from "./WorkbenchShellLayoutHost"
import type { WorkbenchDragControllerState } from "./WorkbenchDragController"
import { createWorkbenchPointerDragHandlers } from "./WorkbenchShellDragState"
import { focusWorkbenchWidgetInstance, runWorkbenchRailAction } from "./WorkbenchShellHostActions"
import {
  reconcileWorkbenchLayoutInstances,
  switchWorkbenchLayout,
} from "./WorkbenchShellLayoutState"
import {
  initializeWorkbenchShellRuntime,
  wireWorkbenchRuntimeEvents,
} from "./WorkbenchShellRuntimeState"
import { createWorkbenchWorkspaceState } from "./WorkbenchShellWorkspaceState"
import {
  createWorkbenchSettingsPanelPropsBuilder,
  openWorkbenchSettings,
} from "./WorkbenchShellSettings"
import {
  applyWorkbenchBackgroundSelection,
  applyWorkbenchThemeSelection,
  switchWorkbenchBackground,
  switchWorkbenchTheme,
} from "./WorkbenchShellAppearanceState"
import {
  saveWorkbenchSearchHistory,
  setWorkbenchDefaultSearchProvider,
  setWorkbenchSearchProviderEnabled,
} from "./WorkbenchShellSearchState"
import { createWorkbenchSearchSurfaces } from "./WorkbenchShellSearchSurfaces"
import { WorkbenchShellSurfaceHost } from "./WorkbenchShellSurfaceHost"
import { buildWorkbenchWidgetViewProps, resolveWorkbenchView } from "./WorkbenchShellViewBridge"
import { createWorkbenchWidgetController } from "./WorkbenchShellWidgetController"
import { SafeWorkbenchLayout, WorkbenchSettingsAboutContent } from "./WorkbenchShellChrome"
import { createWorkbenchShellCommandModels } from "./WorkbenchShellCommands"
import { canPluginOpenExternal, createLayoutSwitchExecution } from "./shellController"
import {
  type CommandExecutionContext,
  resolveDefaultProviderForSearch as resolveDefaultProviderId,
  resolveEnabledSearchProviders,
  resolveWidgetIconLabel,
  resolveWidgetRenderModel,
  type WidgetRenderModel,
} from "./shellHelpers"
import { requireWorkspace } from "./WorkbenchShellUtils"
import { assignGridOrder } from "./workbenchGrid"
import {
  updateWorkspaceBackground,
  updateWorkspaceRecord,
  updateWorkspaceTheme,
} from "./workspaceSession"

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
  const [kernelReady, setKernelReady] = createSignal(false)
  const [instances, setInstances] = createSignal<PluginInstance[]>([])
  const [activeLayoutId, setActiveLayoutId] = createSignal("official.layout.workbench-dashboard")
  const [themeId, setThemeId] = createSignal("official.theme.light")
  const [, setBackgroundId] = createSignal(FALLBACK_BACKGROUND_ID)
  const [workspaceState, setWorkspaceState] = createSignal<Workspace | null>(null)
  const [workspaceList, setWorkspaceList] = createSignal<Workspace[]>([])
  const [settingsOpen, setSettingsOpen] = createSignal(false)
  const [activeSettingsSectionId, setActiveSettingsSectionId] =
    createSignal<SettingsSectionId>("general")
  const [searchSettings, setSearchSettings] = createSignal<WorkbenchSearchSettings>(
    composition.initialState.searchSettings,
  )
  const [modalViewId, setModalViewId] = createSignal<string | null>(null)
  const [modalProps, setModalProps] = createSignal<Record<string, unknown>>({})
  const [fullscreenViewId, setFullscreenViewId] = createSignal<string | null>(null)
  const [fullscreenProps, setFullscreenProps] = createSignal<Record<string, unknown>>({})
  const [expandState, setExpandState] = createSignal<WorkbenchExpandState | null>(null)
  const [dragState, setDragState] = createSignal<WorkbenchDragControllerState | null>(null)
  const [ctxMenu, setCtxMenu] = createSignal<{ x: number; y: number; instanceId: string } | null>(
    null,
  )
  const [addWidgetOpen, setAddWidgetOpen] = createSignal(false)
  const [cmdPaletteOpen, setCmdPaletteOpen] = createSignal(false)
  const toastManager = createToastManager()
  const [toasts, setToasts] = createSignal<ToastRecord[]>([])
  const [searchHistory, setSearchHistory] = createSignal<SearchHistoryEntry[]>([])
  const [inlineSearchQuery, setInlineSearchQuery] = createSignal("")
  const [inlineSearchOpen, setInlineSearchOpen] = createSignal(false)
  const [inlineSearchActiveResultIndex, setInlineSearchActiveResultIndex] = createSignal(-1)
  const responsive = createWorkbenchResponsiveState()
  const isDark = () => themeId() === "official.theme.dark"
  function refreshToasts() {
    setToasts(toastManager.list())
  }
  function showToast(msg: string, options?: ToastOptions) {
    const id = toastManager.show(msg, options)
    refreshToasts()
    if (toastManager.shouldAutoDismiss(id)) {
      const toast = toastManager.list().find((item) => item.id === id)
      setTimeout(() => {
        toastManager.dismiss(id)
        refreshToasts()
      }, toast?.duration ?? 2500)
    }
  }
  const layoutFallback = createLayoutFallbackTracker({ notify: showToast })
  const runtime = props.runtime
  const { database, catalog: pluginCatalog, kernel, plugins, repositories } = runtime
  const { workspaceRepo, instanceRepo, pluginDataRepo, workspaceSnapshotRepo } = repositories
  const [pluginRecords, setPluginRecords] = createSignal<PluginRecord[]>([])
  const applyThemeSelection = (themeId: string) =>
    applyWorkbenchThemeSelection({
      themeId,
      themes: pluginCatalog.listThemes(),
      setThemeId,
      applyTheme: (tokens) => applyThemeTokens(document.documentElement, tokens),
    })
  const applyBackgroundSelection = (backgroundId: string) =>
    applyWorkbenchBackgroundSelection({
      backgroundId,
      backgrounds: pluginCatalog.listBackgroundProviders(),
      setBackgroundId,
      applyBackground: applyBackgroundStyle,
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
      switchLayout,
      switchTheme,
      switchBackground,
      setDefaultSearchProvider,
      setSearchProviderEnabled,
      togglePluginEnabled,
      exportWorkspace,
      importWorkspace,
      createWorkspace: async (name) => {
        const ws = await createWorkspace(name)
        await switchWorkspace(ws.id)
      },
      switchWorkspace,
      deleteWorkspace,
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
        void switchTheme(themeId)
      },
      switchLayout: (layoutId) => {
        void switchLayout(layoutId)
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
    setDefaultProvider: setDefaultSearchProvider,
    saveHistory: saveSearchHistory,
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
      void switchLayout(layoutId)
    },
    switchTheme: (themeId) => {
      void switchTheme(themeId)
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

  async function reconcileInstancesForLayout(
    layoutId: string,
    currentInstances: PluginInstance[],
  ): Promise<{ instances: PluginInstance[]; plan: LayoutSwitchPlan | null }> {
    return reconcileWorkbenchLayoutInstances({
      layoutId,
      currentInstances,
      activeWorkspace: requireWorkspace(workspaceState()),
      findLayout: (targetLayoutId) => pluginCatalog.findLayoutContribution(targetLayoutId),
      executeLayoutSwitch: ({ workspace, instances, targetLayout }) =>
        createLayoutSwitchExecution({
          workspace,
          instances,
          targetLayout,
          now: new Date().toISOString(),
        }),
      assignGridOrder,
      saveInstance: (instance) => instanceRepo.save(instance),
    })
  }

  const workspaceStateActions = createWorkbenchWorkspaceState({
    workspaceRepo,
    instanceRepo,
    pluginDataRepo,
    database,
    availablePluginIds: () => pluginCatalog.pluginIds(),
    getWorkspaceState: workspaceState,
    setWorkspaceState,
    setWorkspaceList,
    setActiveLayoutId,
    setSearchSettings,
    setSearchHistory,
    setInstances,
    applyThemeSelection,
    applyBackgroundSelection,
    reconcileInstancesForLayout,
    clearContextMenu: () => setCtxMenu(null),
    clearExpandState: () => setExpandState(null),
  })

  async function switchLayout(layoutId: string) {
    await switchWorkbenchLayout({
      layoutId,
      activeWorkspace: requireWorkspace(workspaceState()),
      currentInstances: instances(),
      findLayout: (targetLayoutId) => pluginCatalog.findLayoutContribution(targetLayoutId),
      reconcileInstances: reconcileInstancesForLayout,
      clearContextMenu: () => setCtxMenu(null),
      clearExpandState: () => setExpandState(null),
      setInstances,
      setActiveLayoutId,
      saveSnapshot: (snapshot) => workspaceSnapshotRepo.save(snapshot),
      persistWorkspaceLayout: (workspaceId, nextLayoutId, regions) =>
        updateWorkspaceRecord({
          workspaceRepo,
          workspaceId,
          mutator(workspace) {
            workspace.activeLayoutId = nextLayoutId
            workspace.regions = regions
            return workspace
          },
        }),
      setWorkspaceState,
    })
  }

  async function updateWorkspace(mutator: (workspace: Workspace) => Workspace) {
    await workspaceStateActions.updateWorkspace(mutator)
  }

  async function setDefaultSearchProvider(providerId: string) {
    await setWorkbenchDefaultSearchProvider({
      providerId,
      providers: pluginCatalog.listSearchProviders(),
      updateWorkspace,
      setSearchSettings,
      warn: console.warn,
    })
  }

  async function setSearchProviderEnabled(providerId: string, enabled: boolean) {
    await setWorkbenchSearchProviderEnabled({
      providerId,
      enabled,
      currentSettings: searchSettings(),
      providers: pluginCatalog.listSearchProviders(),
      updateWorkspace,
      setSearchSettings,
      warn: console.warn,
    })
  }

  async function togglePluginEnabled(pluginId: string, enabled: boolean) {
    await kernel.setPluginEnabled(pluginId, enabled)
  }

  async function saveSearchHistory(entry: { query: string; providerId: string }) {
    const workspace = requireWorkspace(workspaceState())
    await saveWorkbenchSearchHistory({
      workspaceId: workspace.id,
      history: searchHistory(),
      entry,
      setSearchHistory,
      saveForWorkspace: (pluginId, workspaceId, key, value) =>
        pluginDataRepo.saveForWorkspace(pluginId, workspaceId, key, value),
    })
  }

  async function exportWorkspace(): Promise<string> {
    return workspaceStateActions.exportWorkspace()
  }

  async function importWorkspace(json: string): Promise<{ warnings: string[] }> {
    return workspaceStateActions.importWorkspace(json)
  }

  async function createWorkspace(name: string): Promise<Workspace> {
    return workspaceStateActions.createWorkspace(name)
  }

  async function switchWorkspace(id: string) {
    await workspaceStateActions.switchWorkspace(id)
  }

  async function deleteWorkspace(id: string) {
    await workspaceStateActions.deleteWorkspace(id)
  }

  async function switchTheme(newThemeId: string) {
    await switchWorkbenchTheme({
      workspace: requireWorkspace(workspaceState()),
      themeId: newThemeId,
      themes: pluginCatalog.listThemes(),
      setThemeId,
      applyTheme: (tokens) => applyThemeTokens(document.documentElement, tokens),
      persistTheme: (workspaceId, themeId) =>
        updateWorkspaceTheme({
          workspaceRepo,
          workspaceId,
          themeId,
        }),
      setWorkspaceState,
    })
  }

  async function switchBackground(bgId: string) {
    await switchWorkbenchBackground({
      workspace: requireWorkspace(workspaceState()),
      backgroundId: bgId,
      backgrounds: pluginCatalog.listBackgroundProviders(),
      setBackgroundId,
      applyBackground: applyBackgroundStyle,
      persistBackground: (workspaceId, backgroundId) =>
        updateWorkspaceBackground({
          workspaceRepo,
          workspaceId,
          backgroundId,
        }),
      setWorkspaceState,
    })
  }

  const dragHandlers = createWorkbenchPointerDragHandlers({
    getPersistedInstances: instances,
    getDragState: dragState,
    setDragState,
    persistGridOrder: (orderedInstances) => widgetController.persistGridOrder(orderedInstances),
    showToast,
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
        void switchTheme(isDark() ? "official.theme.light" : "official.theme.dark")
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
    applyThemeSelection,
    applyBackgroundSelection,
    reconcileInstancesForLayout,
  })

  function renderSafeLayout() {
    return (
      <SafeWorkbenchLayout
        isDark={isDark()}
        instances={dragHandlers.displayedInstances()}
        widgetContribution={widgetController.widgetContribution}
        resolveWidgetModel={widgetController.widgetRenderModel}
        getView={(viewId) => resolveWorkbenchView<WidgetViewProps>(kernel.registry.views, viewId)}
        renderWidgetIcon={renderWorkbenchWidgetIcon}
        buildWidgetViewProps={buildWidgetViewProps}
        onOpenCommandPalette={() => setCmdPaletteOpen(true)}
        onToggleTheme={() =>
          void switchTheme(isDark() ? "official.theme.light" : "official.theme.dark")
        }
        onOpenSettings={() => openSettings()}
        onPointerDown={(event, instanceId) => dragHandlers.onPointerDown(event, instanceId)}
        onPointerMove={dragHandlers.onPointerMove}
        onPointerUp={dragHandlers.onPointerUp}
        onPointerCancel={dragHandlers.onPointerCancel}
        onOpenExpand={widgetController.openWidgetExpand}
        onOpenContextMenu={(event, instanceId) => {
          event.preventDefault()
          setCtxMenu({ x: event.clientX, y: event.clientY, instanceId })
        }}
        onResize={(instanceId, size) => {
          void widgetController.changeWidgetSize(instanceId, size)
        }}
        onRemove={(instanceId) => {
          void widgetController.removeWidget(instanceId)
        }}
        isDragging={(instanceId) => dragHandlers.isDragging(instanceId)}
      />
    )
  }

  function renderActiveLayout() {
    const layout = pluginCatalog.findLayoutContribution(activeLayoutId())
    const LayoutView = layout?.view
      ? resolveWorkbenchView(kernel.registry.views, layout.view)
      : undefined

    if (!LayoutView) {
      return renderSafeLayout()
    }
    layoutFallback.clearLayoutError()

    const regions = layoutEngine.buildRegionSlots(
      activeLayoutId(),
      dragHandlers.displayedInstances(),
    )
    const host = layoutEngine.buildHostAPI()

    return (
      <LayoutBoundary
        fallback={renderSafeLayout()}
        onError={(error) => {
          console.error("Layout error:", error)
          layoutFallback.recordLayoutError(activeLayoutId(), error)
        }}
      >
        {LayoutView({
          regions,
          isMobile: responsive.isMobile(),
          host,
        })}
      </LayoutBoundary>
    )
  }

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
          content={renderActiveLayout()}
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
