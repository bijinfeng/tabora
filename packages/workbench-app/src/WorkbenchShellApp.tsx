import type { HostAdapter } from "@tabora/host-adapters"
import { createSignal, Show } from "solid-js"
import type { JSX } from "solid-js"
import type {
  LayoutHostAPI,
  LayoutRegion,
  PluginInstance,
  PluginRecord,
  SearchHistoryEntry,
  SearchViewProps,
  SettingsPanelViewProps,
  WidgetContextMenuContribution,
  WidgetSize,
  WidgetViewProps,
  WorkbenchSearchSettings,
  Workspace,
} from "@tabora/plugin-api"
import {
  createLayoutEngine,
  createToastManager,
  type InstanceRenderer,
  type LayoutSwitchPlan,
  type ToastOptions,
  type ToastRecord,
} from "@tabora/orchestrator"
import { applyThemeTokens } from "@tabora/theme"
import {
  PluginViewBoundary,
  CommandPalette,
  SettingsHost,
  WidgetCardShell,
  LayoutBoundary,
  ToastHost,
  type SettingsSectionId,
  type WidgetHostCallbacks,
} from "@tabora/workbench-shell"

import type { WorkbenchRuntimeBootstrap } from "./bootstrap"
import {
  applyBackgroundStyle,
  FALLBACK_BACKGROUND_ID,
  resolveBackgroundStyle,
} from "./backgroundResolver"
import { createLayoutFallbackTracker } from "./layoutFallback"
import { createWorkbenchResponsiveState } from "./responsive"
import { renderWorkbenchWidgetIcon } from "./WorkbenchShellIcons"
import {
  buildWorkbenchWidgetExpandState,
  buildWorkbenchWidgetInstanceSettingsState,
  isWorkbenchInteractiveElement,
  resolveWorkbenchInstanceSettingsView,
} from "./WorkbenchShellInteractions"
import {
  focusWorkbenchWidgetInstance,
  persistWorkbenchGridOrder,
  runWorkbenchRailAction,
} from "./WorkbenchShellHostActions"
import {
  createWorkbenchSettingsPanelPropsBuilder,
  openWorkbenchSettings,
} from "./WorkbenchShellSettings"
import {
  buildWorkbenchContextMenuModel,
  buildWorkbenchDragDropPlan,
  buildWorkbenchSearchableWidgets,
} from "./WorkbenchShellWidgets"
import {
  SafeWorkbenchLayout,
  WorkbenchAddWidgetModal,
  WorkbenchContextMenuOverlay,
  WorkbenchExpandOverlay,
  WorkbenchFullscreenOverlay,
  WorkbenchPluginModal,
  WorkbenchSettingsAboutContent,
} from "./WorkbenchShellChrome"
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
import { resolveThemeTokens } from "./themeResolver"
import { requireWorkspace } from "./WorkbenchShellUtils"
import { assignGridOrder, gridColumnSpan, gridRowSpan } from "./workbenchGrid"
import {
  createWorkspaceSession,
  deleteWorkspaceSession,
  ensureWorkspaceSession,
  readSearchSettings,
  updateWorkspaceBackground,
  updateWorkspaceRecord,
  updateWorkspaceTheme,
} from "./workspaceSession"
import { exportWorkspaceData, importWorkspaceData } from "./workspaceTransfer"

type SolidView<Props = Record<string, unknown>> = (props: Props) => JSX.Element
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
  const [expandState, setExpandState] = createSignal<{
    instanceId: string
    title: string
    viewId: string
    mode: "card" | "modal" | "fullscreen" | "settings"
    props: WidgetViewProps
  } | null>(null)
  const [dragId, setDragId] = createSignal<string | null>(null)
  const [ctxMenu, setCtxMenu] = createSignal<{ x: number; y: number; instanceId: string } | null>(
    null,
  )
  const [addWidgetOpen, setAddWidgetOpen] = createSignal(false)
  const [cmdPaletteOpen, setCmdPaletteOpen] = createSignal(false)
  const toastManager = createToastManager()
  const [toasts, setToasts] = createSignal<ToastRecord[]>([])
  const [searchHistory, setSearchHistory] = createSignal<SearchHistoryEntry[]>([])
  const responsive = createWorkbenchResponsiveState()
  const isDark = () => themeId() === "official.theme.dark"
  let lastExpandTrigger: HTMLElement | null = null
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

  // Create InstanceRenderer for layout engine
  const instanceRenderer: InstanceRenderer = {
    renderWidget(instance: PluginInstance) {
      const widget = widgetContribution(instance)
      const model = resolveWidgetRenderModel(instance, widget)
      if (!model) return <div class="settings-empty">卡片实例无效：{instance.id}</div>
      const View = widget ? viewOrUndefined(widget.views.card) : undefined
      if (!View) return <div class="settings-empty">Widget view not available</div>

      // Construct host callbacks for this instance
      const hostCallbacks: WidgetHostCallbacks = {
        onDragStart: (e: DragEvent) => onDragStart(e, instance.id),
        onDragOver: (e: DragEvent) => onDragOver(e),
        onDrop: (e: DragEvent) => onDrop(e, instance.id, instance.regionId),
        onDblClick: (e: MouseEvent) => {
          const target = e.target as HTMLElement
          if (isWorkbenchInteractiveElement(target)) return
          openWidgetExpand(instance)
        },
        onContextMenu: (e: MouseEvent) => {
          e.preventDefault()
          setCtxMenu({ x: e.clientX, y: e.clientY, instanceId: instance.id })
        },
        onResize: (size: WidgetSize) => changeWidgetSize(instance.id, size),
        onRemove: () => removeWidget(instance.id),
        onExpand: () => openWidgetExpand(instance),
        isDragging: dragId() === instance.id,
      }

      return (
        <WidgetCardShell
          instance={instance}
          title={model.title}
          icon={renderWorkbenchWidgetIcon(model.icon)}
          supportedSizes={model.supportedSizes}
          currentSize={model.currentSize}
          callbacks={hostCallbacks}
        >
          <PluginViewBoundary instanceId={instance.id} title={model.title}>
            {View(buildWidgetViewProps(instance, model))}
          </PluginViewBoundary>
        </WidgetCardShell>
      )
    },
    renderSearch(instance: PluginInstance) {
      const search = pluginCatalog.findSearchContribution(
        instance.pluginId,
        instance.contributionId,
      )
      if (!search) return <div class="settings-empty">搜索贡献未找到</div>
      const View = viewOrUndefined<SearchViewProps>(search.view)
      if (!View) return <div class="settings-empty">搜索视图不可用：{search.id}</div>

      return (
        <PluginViewBoundary instanceId={instance.id} title={search.title}>
          {View({
            providers: resolveEnabledSearchProviders(
              searchSettings(),
              pluginCatalog.listSearchProviders(),
            ),
            defaultProviderId: resolveDefaultProviderId(
              searchSettings(),
              pluginCatalog.listSearchProviders(),
            ),
            openExternal: (url) => openExternalForPlugin(instance.pluginId, url),
            onDefaultProviderChange: setDefaultSearchProvider,
            searchHistory: searchHistory(),
            commands: commandItems(),
            widgets: searchableWidgets(),
            onSaveHistory: saveSearchHistory,
            onClearHistory: clearSearchHistory,
          })}
        </PluginViewBoundary>
      )
    },
  }

  // Create LayoutHostAPI for layout engine
  const layoutHostAPI: LayoutHostAPI = {
    getGlobalActions: (surface) => {
      const layoutToggle = {
        id: "layout-switch" as const,
        label:
          activeLayoutId() === "official.layout.workbench-dashboard"
            ? "切换到流式"
            : "切换到仪表盘",
        icon:
          activeLayoutId() === "official.layout.workbench-dashboard"
            ? "layout-stream"
            : "layout-dashboard",
        shortcut: "⌘L",
        run: () => {
          const next =
            activeLayoutId() === "official.layout.workbench-dashboard"
              ? "official.layout.workbench-stream"
              : "official.layout.workbench-dashboard"
          void switchLayout(next)
        },
      }
      if (surface === "rail") {
        return [
          {
            id: "home",
            label: "主页",
            icon: "⌂",
            isActive: true,
            run: () => runRailAction("home"),
          },
          {
            id: "add-widget",
            label: "添加卡片",
            icon: "+",
            run: () => runRailAction("add-widget"),
          },
          { id: "theme", label: "切换主题", icon: "☼", run: () => runRailAction("theme") },
          { id: "settings", label: "设置", icon: "⚙", run: () => runRailAction("settings") },
        ]
      }
      if (surface === "toolbar") {
        return [
          {
            id: "command",
            label: "命令",
            icon: "⌘K",
            shortcut: "⌘K",
            run: () => setCmdPaletteOpen(true),
          },
          layoutToggle,
          {
            id: "theme",
            label: isDark() ? "明亮" : "暗色",
            icon: isDark() ? "☀" : "☾",
            shortcut: "⌘T",
            run: () => {
              void switchTheme(isDark() ? "official.theme.light" : "official.theme.dark")
            },
          },
          { id: "settings", label: "设置", icon: "⚙", run: () => runRailAction("settings") },
        ]
      }
      return []
    },
    openSettings: (panelId?: string) => openSettings(panelId),
    openCommandPalette: () => setCmdPaletteOpen(true),
    openAddWidget: () => setAddWidgetOpen(true),
    toggleTheme: () => {
      void switchTheme(isDark() ? "official.theme.light" : "official.theme.dark")
    },
    isDark: () => isDark(),
  }

  // Create layout engine
  const layoutEngine = createLayoutEngine({
    catalog: pluginCatalog,
    instanceRenderer,
    hostActions: layoutHostAPI,
  })

  function makeScopedData(pluginId: string, instanceId: string): WidgetViewProps["data"] {
    return {
      get<T>(key: string): Promise<T | undefined> {
        return pluginDataRepo.getByInstance<T>(pluginId, instanceId, key)
      },
      save<T>(key: string, value: T): Promise<void> {
        return pluginDataRepo.saveForInstance<T>(pluginId, instanceId, key, value)
      },
    }
  }

  function viewOrUndefined<Props = Record<string, unknown>>(
    viewId: string,
  ): SolidView<Props> | undefined {
    return kernel.registry.views.has(viewId)
      ? (kernel.registry.views.get(viewId) as SolidView<Props>)
      : undefined
  }

  function buildWidgetViewProps(
    instance: PluginInstance,
    model: WidgetRenderModel,
  ): WidgetViewProps {
    return {
      instanceId: instance.id,
      pluginId: instance.pluginId,
      contributionId: instance.contributionId,
      size: model.currentSize,
      supportedSizes: model.supportedSizes,
      config: instance.config,
      data: makeScopedData(instance.pluginId, instance.id),
      host: {
        async updateConfig(value) {
          const updated: PluginInstance = {
            ...instance,
            config: value,
            updatedAt: new Date().toISOString(),
          }
          await instanceRepo.save(updated)
          setInstances((prev) => prev.map((item) => (item.id === instance.id ? updated : item)))
        },
        async removeInstance() {
          await removeWidget(instance.id)
        },
        async requestResize(size) {
          await changeWidgetSize(instance.id, size)
        },
        openModal(viewId, props) {
          setModalViewId(viewId)
          setModalProps(
            typeof props === "object" && props !== null ? (props as Record<string, unknown>) : {},
          )
        },
        closeModal() {
          setModalViewId(null)
        },
        openExpand() {
          openWidgetExpand(instance)
        },
        showToast,
        async openExternal(url) {
          return openExternalForPlugin(instance.pluginId, url)
        },
      },
    }
  }

  void kernel.discover(plugins).then(async () => {
    await kernel.activateEnabledPlugins()
    setPluginRecords(await repositories.pluginRecordRepo.getAll())

    const session = await ensureWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      pluginDataRepo,
      searchProviders: pluginCatalog.listSearchProviders(),
    })

    setWorkspaceState(session.workspace)
    setSearchSettings(session.searchSettings)
    setActiveLayoutId(session.activeLayoutId)
    setThemeId(session.activeThemeId)

    const allThemes = pluginCatalog.listThemes()
    const tokens = resolveThemeTokens(session.activeThemeId, allThemes)
    applyThemeTokens(document.documentElement, tokens)

    const allBackgrounds = pluginCatalog.listBackgroundProviders()
    setBackgroundId(session.activeBackgroundId)
    applyBackgroundStyle(resolveBackgroundStyle(session.activeBackgroundId, allBackgrounds))

    setSearchHistory(session.searchHistory)
    const { instances: nextInstances } = await reconcileInstancesForLayout(
      session.activeLayoutId,
      session.instances,
    )
    setInstances(nextInstances)
    const allWorkspaces = await workspaceRepo.getAll()
    setWorkspaceList(allWorkspaces)
    setKernelReady(true)
  })

  kernel.events.on("ui.modal.open", (payload: any) => {
    setModalViewId(payload.viewId)
    setModalProps(payload.props ?? {})
  })
  kernel.events.on("ui.modal.close", () => setModalViewId(null))
  kernel.events.on("ui.fullscreen.open", (payload: any) => {
    setFullscreenViewId(payload.viewId)
    setFullscreenProps(payload.props ?? {})
  })
  kernel.events.on("ui.fullscreen.close", () => setFullscreenViewId(null))
  kernel.events.on("ui.toast.show", (payload: any) => {
    if (typeof payload.message === "string") {
      showToast(payload.message, payload.options)
    }
  })
  kernel.events.on("host.external.open", (payload: any) => {
    if (typeof payload.url === "string") {
      window.open(payload.url, "_blank")
    }
  })

  function layoutRegions(layoutId = activeLayoutId()): LayoutRegion[] {
    return pluginCatalog.findLayoutContribution(layoutId)?.regions ?? []
  }

  function reassignInstancesForLayout(layoutId: string, currentInstances: PluginInstance[]) {
    const activeWorkspace = requireWorkspace(workspaceState())
    const targetLayout = pluginCatalog.findLayoutContribution(layoutId)
    if (!targetLayout) return currentInstances
    return createLayoutSwitchExecution({
      workspace: activeWorkspace,
      instances: currentInstances,
      targetLayout,
      now: new Date().toISOString(),
    })
  }

  async function reconcileInstancesForLayout(
    layoutId: string,
    currentInstances: PluginInstance[],
  ): Promise<{ instances: PluginInstance[]; plan: LayoutSwitchPlan | null }> {
    const execution = reassignInstancesForLayout(layoutId, currentInstances)
    if (Array.isArray(execution)) {
      return { instances: assignGridOrder(execution), plan: null }
    }
    const nextInstances = execution.instances
    for (let index = 0; index < nextInstances.length; index += 1) {
      const previous = currentInstances[index]
      const next = nextInstances[index]
      if (
        previous &&
        next &&
        (previous.regionId !== next.regionId || previous.updatedAt !== next.updatedAt)
      ) {
        await instanceRepo.save(next)
      }
    }
    return { instances: assignGridOrder(nextInstances), plan: execution.plan }
  }

  async function switchLayout(layoutId: string) {
    const activeWorkspace = requireWorkspace(workspaceState())
    const targetLayout = pluginCatalog.findLayoutContribution(layoutId)
    if (!targetLayout) return
    setCtxMenu(null)
    setExpandState(null)
    const { instances: nextInstances, plan } = await reconcileInstancesForLayout(
      layoutId,
      instances(),
    )
    setInstances(nextInstances)
    setActiveLayoutId(layoutId)
    if (!plan) return
    await workspaceSnapshotRepo.save(plan.snapshot)

    const updatedWorkspace = await updateWorkspaceRecord({
      workspaceRepo,
      workspaceId: activeWorkspace.id,
      mutator(workspace) {
        workspace.activeLayoutId = layoutId
        workspace.regions = plan.nextRegions
        return workspace
      },
    })

    if (updatedWorkspace) {
      setWorkspaceState(updatedWorkspace)
    }
  }

  async function updateWorkspace(mutator: (workspace: Workspace) => Workspace) {
    const activeWorkspace = requireWorkspace(workspaceState())
    const updated = await updateWorkspaceRecord({
      workspaceRepo,
      workspaceId: activeWorkspace.id,
      mutator,
    })
    if (updated) {
      setWorkspaceState(updated)
    }
  }

  async function setDefaultSearchProvider(providerId: string) {
    if (!pluginCatalog.listSearchProviders().some((provider) => provider.id === providerId)) {
      console.warn(`Unknown search provider: "${providerId}"`)
      return
    }
    await updateWorkspace((workspace) => {
      const currentSearch = (workspace.config?.search as Record<string, unknown>) ?? {}
      workspace.config = {
        ...(workspace.config ?? {}),
        search: { ...currentSearch, defaultProviderId: providerId },
      }
      return workspace
    })
    setSearchSettings((prev) => ({ ...prev, defaultProviderId: providerId }))
  }

  async function setSearchProviderEnabled(providerId: string, enabled: boolean) {
    if (!pluginCatalog.listSearchProviders().some((provider) => provider.id === providerId)) {
      console.warn(`Unknown search provider: "${providerId}"`)
      return
    }
    await updateWorkspace((workspace) => {
      const currentSearch = (workspace.config?.search as Record<string, unknown>) ?? {}
      const currentEnabled = (
        Array.isArray(currentSearch.enabledProviderIds)
          ? currentSearch.enabledProviderIds
          : pluginCatalog.listSearchProviders().map((provider) => provider.id)
      ) as string[]
      const nextEnabled = enabled
        ? [...new Set([...currentEnabled, providerId])]
        : currentEnabled.filter((id) => id !== providerId)
      workspace.config = {
        ...(workspace.config ?? {}),
        search: { ...currentSearch, enabledProviderIds: nextEnabled },
      }
      return workspace
    })
    setSearchSettings((prev) => {
      const currentEnabled =
        prev.enabledProviderIds ??
        pluginCatalog.listSearchProviders().map((provider) => provider.id)
      const nextEnabled = enabled
        ? [...new Set([...currentEnabled, providerId])]
        : currentEnabled.filter((id) => id !== providerId)
      return { ...prev, enabledProviderIds: nextEnabled }
    })
  }

  async function togglePluginEnabled(pluginId: string, enabled: boolean) {
    await kernel.setPluginEnabled(pluginId, enabled)
  }

  async function saveSearchHistory(entry: { query: string; providerId: string }) {
    const workspace = requireWorkspace(workspaceState())
    const history = searchHistory()
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000
    const filtered = history.filter(
      (h) =>
        !(
          h.query === entry.query &&
          h.providerId === entry.providerId &&
          new Date(h.timestamp).getTime() > fiveMinutesAgo
        ),
    )
    const next: SearchHistoryEntry[] = [
      ...filtered,
      { ...entry, timestamp: new Date().toISOString() },
    ]
    setSearchHistory(next)
    await pluginDataRepo.saveForWorkspace(
      "official.search.command-bar",
      workspace.id,
      "search-history",
      next,
    )
  }

  async function clearSearchHistory() {
    const workspace = requireWorkspace(workspaceState())
    setSearchHistory([])
    await pluginDataRepo.saveForWorkspace(
      "official.search.command-bar",
      workspace.id,
      "search-history",
      [],
    )
  }

  async function exportWorkspace(): Promise<string> {
    const workspace = workspaceState()
    if (!workspace) throw new Error("Workspace not loaded")
    return exportWorkspaceData({
      workspace,
      instanceRepo,
      database,
    })
  }

  async function importWorkspace(json: string): Promise<{ warnings: string[] }> {
    const result = await importWorkspaceData({
      json,
      workspaceRepo,
      instanceRepo,
      pluginDataRepo,
      database,
      availablePluginIds: pluginCatalog.pluginIds(),
    })

    setCtxMenu(null)
    setExpandState(null)
    setWorkspaceState(result.workspace)
    const { instances: nextInstances } = await reconcileInstancesForLayout(
      result.workspace.activeLayoutId,
      result.instances,
    )
    setInstances(nextInstances)
    setActiveLayoutId(result.workspace.activeLayoutId)
    setThemeId(result.workspace.activeThemeId)
    applyThemeTokens(
      document.documentElement,
      resolveThemeTokens(result.workspace.activeThemeId, pluginCatalog.listThemes()),
    )
    const importedBackgroundId = result.workspace.activeBackgroundProviderId
    setBackgroundId(importedBackgroundId)
    applyBackgroundStyle(
      resolveBackgroundStyle(importedBackgroundId, pluginCatalog.listBackgroundProviders()),
    )
    setSearchSettings(readSearchSettings(result.workspace, pluginCatalog.listSearchProviders()))
    setWorkspaceList((prev) => [...prev, result.workspace])

    return { warnings: result.warnings }
  }

  async function createWorkspace(name: string): Promise<Workspace> {
    const ws = await createWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      name,
    })
    setWorkspaceList((prev) => [...prev, ws])
    return ws
  }

  async function switchWorkspace(id: string) {
    if (id === workspaceState()?.id) return
    const session = await ensureWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      pluginDataRepo,
      searchProviders: pluginCatalog.listSearchProviders(),
      workspaceId: id,
    })
    setCtxMenu(null)
    setExpandState(null)
    setWorkspaceState(session.workspace)
    setActiveLayoutId(session.activeLayoutId)
    setThemeId(session.activeThemeId)
    const allThemes = pluginCatalog.listThemes()
    applyThemeTokens(document.documentElement, resolveThemeTokens(session.activeThemeId, allThemes))
    const allBg = pluginCatalog.listBackgroundProviders()
    const bg = session.activeBackgroundId
    setBackgroundId(bg)
    applyBackgroundStyle(resolveBackgroundStyle(bg, allBg))
    setSearchSettings(session.searchSettings)
    setSearchHistory(session.searchHistory)
    const { instances: nextInstances } = await reconcileInstancesForLayout(
      session.activeLayoutId,
      session.instances,
    )
    setInstances(nextInstances)
  }

  async function deleteWorkspace(id: string) {
    await deleteWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      pluginDataRepo,
      workspaceId: id,
    })
    setWorkspaceList((prev) => prev.filter((w) => w.id !== id))
    if (workspaceState()?.id === id) {
      const fallback = await workspaceRepo.get("default")
      if (fallback) {
        await switchWorkspace("default")
      }
    }
  }

  async function switchTheme(newThemeId: string) {
    const activeWorkspace = requireWorkspace(workspaceState())
    const tokens = resolveThemeTokens(newThemeId, pluginCatalog.listThemes())
    applyThemeTokens(document.documentElement, tokens)
    setThemeId(newThemeId)
    const workspace = await updateWorkspaceTheme({
      workspaceRepo,
      workspaceId: activeWorkspace.id,
      themeId: newThemeId,
    })
    if (workspace) {
      setWorkspaceState(workspace)
    }
  }

  async function switchBackground(bgId: string) {
    const activeWorkspace = requireWorkspace(workspaceState())
    applyBackgroundStyle(resolveBackgroundStyle(bgId, pluginCatalog.listBackgroundProviders()))
    setBackgroundId(bgId)
    const workspace = await updateWorkspaceBackground({
      workspaceRepo,
      workspaceId: activeWorkspace.id,
      backgroundId: bgId,
    })
    if (workspace) {
      setWorkspaceState(workspace)
    }
  }

  const widgetContribution = (instance: Pick<PluginInstance, "pluginId" | "contributionId">) =>
    pluginCatalog.findWidgetContribution(instance.pluginId, instance.contributionId)

  const widgetRenderModel = (instance: PluginInstance): WidgetRenderModel | null =>
    resolveWidgetRenderModel(instance, widgetContribution(instance))

  const contextMenuContributions = (instance: PluginInstance): WidgetContextMenuContribution[] =>
    widgetContribution(instance)?.contextMenus ?? []

  async function addWidget(pluginId: string, contributionId: string) {
    const workspace = requireWorkspace(workspaceState())
    const widget = pluginCatalog.findWidgetContribution(pluginId, contributionId)
    if (!widget) return
    const widgetRegionId =
      layoutRegions().find((region) => region.accepts.includes("widget"))?.id ?? "mainGrid"
    const id = `${contributionId}-${Date.now()}`
    const inst: PluginInstance = {
      id,
      workspaceId: workspace.id,
      pluginId: widget.pluginId,
      contributionId,
      extensionPoint: "widget",
      regionId: widgetRegionId,
      enabled: true,
      size: widget.defaultSize,
      config: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const next = assignGridOrder([...instances(), inst])
    await instanceRepo.save(next[next.length - 1]!)
    setInstances(next)
  }

  async function removeWidget(instanceId: string) {
    if (expandState()?.instanceId === instanceId) {
      closeExpand()
    }
    if (ctxMenu()?.instanceId === instanceId) {
      setCtxMenu(null)
    }
    await instanceRepo.remove(instanceId)
    setInstances((prev) => prev.filter((i) => i.id !== instanceId))
  }

  async function changeWidgetSize(instanceId: string, newSize: WidgetSize) {
    const inst = instances().find((i) => i.id === instanceId)
    if (!inst) return
    const updated: PluginInstance = {
      ...inst,
      size: newSize,
      grid: {
        ...(inst.grid ?? { x: 0, y: 0, rowSpan: 1 }),
        colSpan: gridColumnSpan(newSize),
        rowSpan: gridRowSpan(newSize),
      },
      updatedAt: new Date().toISOString(),
    }
    await instanceRepo.save(updated)
    setInstances((prev) => prev.map((i) => (i.id === instanceId ? updated : i)))
  }

  function closeExpand() {
    setExpandState(null)
    if (lastExpandTrigger) {
      requestAnimationFrame(() => {
        lastExpandTrigger?.focus()
      })
    }
  }

  function openWidgetExpand(instance: PluginInstance, trigger?: HTMLElement) {
    const result = buildWorkbenchWidgetExpandState({
      instance,
      model: widgetRenderModel(instance),
      widget: widgetContribution(instance),
      hasView: (viewId) => kernel.registry.views.has(viewId),
      buildWidgetViewProps,
    })
    if (!result.expandState) {
      if (result.errorMessage) showToast(result.errorMessage)
      return
    }
    lastExpandTrigger =
      trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
    setCtxMenu(null)
    setExpandState(result.expandState)
  }

  function openWidgetInstanceSettings(instance: PluginInstance) {
    const result = buildWorkbenchWidgetInstanceSettingsState({
      instance,
      model: widgetRenderModel(instance),
      widget: widgetContribution(instance),
      hasView: (viewId) => kernel.registry.views.has(viewId),
      buildWidgetViewProps,
    })
    if (!result.expandState) {
      if (result.errorMessage) showToast(result.errorMessage)
      return
    }
    lastExpandTrigger =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    setCtxMenu(null)
    setExpandState(result.expandState)
  }

  function onDragStart(e: DragEvent, instanceId: string) {
    setDragId(instanceId)
    e.dataTransfer!.effectAllowed = "move"
    e.dataTransfer!.setData("text/plain", instanceId)
  }

  function onDragOver(e: DragEvent) {
    e.preventDefault()
    e.dataTransfer!.dropEffect = "move"
  }

  function contextMenuModel() {
    return buildWorkbenchContextMenuModel({
      menu: ctxMenu(),
      instances: instances(),
      resolveWidgetRenderModel: widgetRenderModel,
      resolveContextMenus: contextMenuContributions,
      availableCommandIds: availableCommandIds(),
      runCommand,
      hasInstanceSettings: (instance) =>
        resolveWorkbenchInstanceSettingsView(widgetContribution(instance), (viewId) =>
          kernel.registry.views.has(viewId),
        ) !== null,
      onResize: (instanceId, size) => {
        void changeWidgetSize(instanceId, size)
      },
      onExpand: (instanceId) => {
        const target = instances().find((instance) => instance.id === instanceId)
        if (target) openWidgetExpand(target)
      },
      onOpenSettings: (instanceId) => {
        const target = instances().find((instance) => instance.id === instanceId)
        if (target) openWidgetInstanceSettings(target)
      },
      onRemove: (instanceId) => {
        void removeWidget(instanceId)
        showToast("实例已移除")
      },
    })
  }

  const searchableWidgets = () =>
    buildWorkbenchSearchableWidgets({
      instances: instances(),
      resolveWidgetContribution: (pluginId, contributionId) =>
        widgetContribution({ pluginId, contributionId }),
      buildFocusAction: (instanceId) => () => {
        if (focusWorkbenchWidgetInstance(instanceId)) showToast("已定位到对应卡片")
      },
    })

  async function persistGridOrder(orderedInstances: PluginInstance[]) {
    await persistWorkbenchGridOrder({
      currentInstances: instances(),
      orderedInstances,
      saveInstance: (instance) => instanceRepo.save(instance),
      setInstances,
    })
  }

  function onDrop(e: DragEvent, targetId: string, _regionId: string) {
    e.preventDefault()
    const plan = buildWorkbenchDragDropPlan({
      dragId: dragId(),
      targetId,
      instances: instances(),
    })
    if (!plan) return
    setDragId(null)
    if (!plan.changed) return
    void persistGridOrder(plan.instances)
    showToast("排序已更新")
  }

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

  function renderSafeLayout() {
    return (
      <SafeWorkbenchLayout
        isDark={isDark()}
        instances={instances()}
        widgetContribution={widgetContribution}
        resolveWidgetModel={(instance) =>
          resolveWidgetRenderModel(instance, widgetContribution(instance))
        }
        getView={(viewId) => viewOrUndefined<WidgetViewProps>(viewId)}
        renderWidgetIcon={renderWorkbenchWidgetIcon}
        buildWidgetViewProps={buildWidgetViewProps}
        onOpenCommandPalette={() => setCmdPaletteOpen(true)}
        onToggleTheme={() =>
          void switchTheme(isDark() ? "official.theme.light" : "official.theme.dark")
        }
        onOpenSettings={() => openSettings()}
        onDragStart={setDragId}
        onDragEnd={() => setDragId(null)}
        onOpenExpand={openWidgetExpand}
        onOpenContextMenu={(event, instanceId) => {
          event.preventDefault()
          setCtxMenu({ x: event.clientX, y: event.clientY, instanceId })
        }}
        onResize={(instanceId, size) => {
          void changeWidgetSize(instanceId, size)
        }}
        onRemove={(instanceId) => {
          void removeWidget(instanceId)
        }}
        isDragging={(instanceId) => dragId() === instanceId}
      />
    )
  }

  function renderActiveLayout() {
    const layout = pluginCatalog.findLayoutContribution(activeLayoutId())
    const LayoutView = layout?.view ? viewOrUndefined(layout.view) : undefined

    if (!LayoutView) {
      return renderSafeLayout()
    }
    layoutFallback.clearLayoutError()

    const regions = layoutEngine.buildRegionSlots(activeLayoutId(), instances())
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
          closeExpand()
          setCtxMenu(null)
          setAddWidgetOpen(false)
        }
      }}
      tabIndex={-1}
    >
      <Show when={kernelReady()} fallback={<div class="loading">Loading Tabora...</div>}>
        {renderActiveLayout()}
        <WorkbenchAddWidgetModal
          open={addWidgetOpen()}
          availableWidgets={pluginCatalog.listWidgetContributions()}
          widgetIconLabel={resolveWidgetIconLabel}
          onAdd={(pluginId, widgetId) => {
            void addWidget(pluginId, widgetId)
            setAddWidgetOpen(false)
          }}
          onClose={() => setAddWidgetOpen(false)}
        />
        <SettingsHost
          open={settingsOpen()}
          panels={pluginCatalog.listSettingsPanels()}
          activeSectionId={activeSettingsSectionId()}
          onSectionChange={setActiveSettingsSectionId}
          onClose={() => setSettingsOpen(false)}
          getView={(viewId) => viewOrUndefined<SettingsPanelViewProps>(viewId)}
          panelProps={buildSettingsPanelProps}
          aboutContent={
            <WorkbenchSettingsAboutContent
              workspaceName={workspaceState()?.name ?? "未加载"}
              enabledPluginCount={
                pluginCatalog.pluginSummaries(pluginRecords()).filter((plugin) => plugin.enabled)
                  .length
              }
            />
          }
        />
        <WorkbenchExpandOverlay
          expandState={expandState()}
          getView={(viewId) => viewOrUndefined<WidgetViewProps>(viewId)}
          widgetIconForProps={(viewProps) =>
            renderWorkbenchWidgetIcon(widgetContribution(viewProps)?.icon)
          }
          onClose={closeExpand}
        />
        <WorkbenchPluginModal
          viewId={modalViewId()}
          modalProps={modalProps()}
          getView={(viewId) => viewOrUndefined(viewId)}
          onClose={() => setModalViewId(null)}
        />
        <WorkbenchFullscreenOverlay
          viewId={fullscreenViewId()}
          fullscreenProps={fullscreenProps()}
          getView={(viewId) => viewOrUndefined(viewId)}
          onClose={() => setFullscreenViewId(null)}
        />
        <WorkbenchContextMenuOverlay
          menu={ctxMenu()}
          sections={contextMenuModel()?.sections ?? []}
          onClose={() => setCtxMenu(null)}
        />
        <ToastHost toasts={toasts()} onAction={(commandId) => runCommand(commandId, {})} />
      </Show>
      <CommandPalette
        isOpen={cmdPaletteOpen()}
        onClose={() => setCmdPaletteOpen(false)}
        commands={commandItems()}
        widgets={searchableWidgets()}
        providers={resolveEnabledSearchProviders(
          searchSettings(),
          pluginCatalog.listSearchProviders(),
        )}
        defaultProviderId={resolveDefaultProviderId(
          searchSettings(),
          pluginCatalog.listSearchProviders(),
        )}
        searchHistory={searchHistory()}
        openExternal={openExternal}
        onSaveHistory={saveSearchHistory}
      />
    </div>
  )
}
