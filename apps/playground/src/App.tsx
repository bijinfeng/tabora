import { TaboraMark } from "@tabora/brand"
import { createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import type {
  BackgroundProviderContribution,
  LayoutHostAPI,
  LayoutRegion,
  PluginInstance,
  SearchCommandEntry,
  SearchHistoryEntry,
  SearchProviderContribution,
  SearchViewProps,
  SearchWidgetEntry,
  SettingsPanelViewProps,
  ThemeContribution,
  WidgetSize,
  WidgetViewProps,
  WorkbenchSearchSettings,
  Workspace,
} from "@tabora/plugin-api"
import { builtinPlugins } from "@tabora/builtin-plugin-registry"
import { createWorkbenchResponsiveState } from "@tabora/workbench-app"
import { createLayoutEngine, type InstanceRenderer } from "@tabora/orchestrator"
import { applyThemeTokens } from "@tabora/theme"
import {
  PluginViewBoundary,
  CommandPalette,
  SettingsHost,
  WidgetCardShell,
  LayoutBoundary,
  ToastHost,
  resolveInitialSettingsSectionId,
  type SettingsSectionId,
  type WidgetHostCallbacks,
} from "@tabora/workbench-shell"
import { Clock, Link2, Pencil, Sun, Moon, Target, CheckSquare, X } from "lucide-solid"

import { assignGridOrder, gridColumnSpan, gridRowSpan } from "./workbenchGrid"
import { resolveThemeTokens } from "./themeResolver"
import {
  applyBackgroundStyle,
  resolveBackgroundStyle,
  FALLBACK_BACKGROUND_ID,
} from "./backgroundResolver"
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
import { createWorkspaceRegions } from "./defaultWorkspaceSeed"
import {
  createPlaygroundRuntimeBootstrap,
  createPlaygroundWorkbenchComposition,
} from "./workbenchComposition"

type SolidView<Props = Record<string, unknown>> = (props: Props) => JSX.Element

function pluginBoundaryId(props: Record<string, unknown>, fallback: string): string {
  return typeof props.instanceId === "string" ? props.instanceId : fallback
}

function requireWorkspace(workspace: Workspace | null): Workspace {
  if (!workspace) {
    throw new Error("Workspace is not ready")
  }
  return workspace
}

export function App() {
  const composition = createPlaygroundWorkbenchComposition()
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
    mode: "card" | "modal" | "fullscreen"
    props: WidgetViewProps
  } | null>(null)
  const [dragId, setDragId] = createSignal<string | null>(null)
  const [ctxMenu, setCtxMenu] = createSignal<{ x: number; y: number; instanceId: string } | null>(
    null,
  )
  const [addWidgetOpen, setAddWidgetOpen] = createSignal(false)
  const [cmdPaletteOpen, setCmdPaletteOpen] = createSignal(false)
  const [toasts, setToasts] = createSignal<{ id: number; msg: string }[]>([])
  const [searchHistory, setSearchHistory] = createSignal<SearchHistoryEntry[]>([])
  const responsive = createWorkbenchResponsiveState()
  let lastExpandTrigger: HTMLElement | null = null
  let toastSeq = 0
  function showToast(msg: string) {
    const id = ++toastSeq
    setToasts((t) => [...t, { id, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500)
  }

  const commandItems = () =>
    [
      {
        id: "toggle-theme",
        icon: "T",
        name: "切换主题",
        desc: isDark() ? "暗色 → 明亮" : "明亮 → 暗色",
        shortcut: "⌘T",
        action: () => void switchTheme(isDark() ? "official.theme.light" : "official.theme.dark"),
      },
      {
        id: "toggle-layout",
        icon: "L",
        name: "切换布局",
        desc:
          activeLayoutId() === "official.layout.workbench-dashboard"
            ? "仪表盘 → 流式"
            : "流式 → 仪表盘",
        shortcut: "⌘L",
        action: () => {
          const next =
            activeLayoutId() === "official.layout.workbench-dashboard"
              ? "official.layout.workbench-stream"
              : "official.layout.workbench-dashboard"
          void switchLayout(next)
        },
      },
      {
        id: "add-widget",
        icon: "+",
        name: "添加卡片",
        desc: "向工作台添加新卡片",
        shortcut: "⌘N",
        action: () => setAddWidgetOpen(true),
      },
      {
        id: "open-settings",
        icon: "S",
        name: "打开设置",
        desc: "配置工作台",
        shortcut: "⌘,",
        action: () => openSettings("official.settings.workspace.appearance"),
      },
      {
        id: "open-shortcuts",
        icon: "?",
        name: "快捷键参考",
        desc: "查看所有快捷键",
        action: () => showToast("快捷键：⌘K、⌘L、⌘T、⌘,、Esc"),
      },
    ] satisfies SearchCommandEntry[]

  const runtime = createPlaygroundRuntimeBootstrap()
  const { database, catalog: pluginCatalog, kernel, repositories } = runtime
  const { workspaceRepo, instanceRepo, pluginDataRepo } = repositories

  // Create InstanceRenderer for layout engine
  const instanceRenderer: InstanceRenderer = {
    renderWidget(instance: PluginInstance) {
      const widget = widgetContribution(instance)
      const title = widget?.title ?? instance.contributionId
      const View = widgetCardView(instance)
      if (!View) return <div class="settings-empty">Widget view not available</div>

      // Construct host callbacks for this instance
      const hostCallbacks: WidgetHostCallbacks = {
        onDragStart: (e: DragEvent) => onDragStart(e, instance.id),
        onDragOver: (e: DragEvent) => onDragOver(e),
        onDrop: (e: DragEvent) => onDrop(e, instance.id, instance.regionId),
        onDblClick: (e: MouseEvent) => {
          const target = e.target as HTMLElement
          if (isInteractiveElement(target)) return
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
          title={title}
          icon={renderWidgetIcon(widget?.icon)}
          supportedSizes={widget?.supportedSizes ?? ["S", "M", "L"]}
          currentSize={instance.size ?? "M"}
          callbacks={hostCallbacks}
        >
          <PluginViewBoundary instanceId={instance.id} title={title}>
            {View(buildWidgetViewProps(instance))}
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
            providers: enabledSearchProviders(),
            defaultProviderId: resolveDefaultProviderForSearch(),
            openExternal,
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

  function buildWidgetViewProps(instance: PluginInstance): WidgetViewProps {
    return {
      instanceId: instance.id,
      pluginId: instance.pluginId,
      contributionId: instance.contributionId,
      config: instance.config,
      data: makeScopedData(instance.pluginId, instance.id),
    }
  }

  void kernel.discover(builtinPlugins).then(async () => {
    await kernel.activateEnabledPlugins()

    const session = await ensureWorkspaceSession({
      workspaceRepo,
      instanceRepo,
      pluginDataRepo,
      searchProviders: searchProviders(),
    })

    setWorkspaceState(session.workspace)
    setSearchSettings(session.searchSettings)
    setActiveLayoutId(session.activeLayoutId)
    setThemeId(session.activeThemeId)

    const allThemes = themes()
    const tokens = resolveThemeTokens(session.activeThemeId, allThemes)
    applyThemeTokens(document.documentElement, tokens)

    const allBackgrounds = backgrounds()
    setBackgroundId(session.activeBackgroundId)
    applyBackgroundStyle(resolveBackgroundStyle(session.activeBackgroundId, allBackgrounds))

    setSearchHistory(session.searchHistory)
    const nextInstances = await reconcileInstancesForLayout(
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
  kernel.events.on("host.external.open", (payload: any) => {
    if (typeof payload.url === "string") {
      window.open(payload.url, "_blank")
    }
  })

  function themes(): ThemeContribution[] {
    return pluginCatalog.listThemes()
  }

  function searchProviders(): SearchProviderContribution[] {
    return pluginCatalog.listSearchProviders()
  }

  function backgrounds(): BackgroundProviderContribution[] {
    return pluginCatalog.listBackgroundProviders()
  }

  function layouts() {
    return pluginCatalog.listLayouts()
  }

  function layoutRegions(layoutId = activeLayoutId()): LayoutRegion[] {
    return pluginCatalog.findLayoutContribution(layoutId)?.regions ?? []
  }

  function buildWorkspaceRegionState(
    layoutId: string,
    currentInstances: PluginInstance[],
  ): Workspace["regions"] {
    return createWorkspaceRegions(
      layoutRegions(layoutId).map((region) => ({
        regionId: region.id,
        accepts: region.accepts,
      })),
      currentInstances.map((instance) => ({
        instanceId: instance.id,
        regionId: instance.regionId,
      })),
    )
  }

  function reassignInstancesForLayout(
    layoutId: string,
    currentInstances: PluginInstance[],
  ): PluginInstance[] {
    const nextRegions = layoutRegions(layoutId)
    const nextWidgetRegion = nextRegions.find((region) => region.accepts.includes("widget"))
    const nextSearchRegion = nextRegions.find((region) => region.accepts.includes("search"))
    const now = new Date().toISOString()

    return currentInstances.map((instance) => {
      const supportsCurrentRegion = nextRegions.some(
        (region) =>
          region.id === instance.regionId && region.accepts.includes(instance.extensionPoint),
      )
      if (supportsCurrentRegion) {
        return instance
      }

      if (instance.extensionPoint === "widget" && nextWidgetRegion) {
        return { ...instance, regionId: nextWidgetRegion.id, updatedAt: now }
      }

      if (instance.extensionPoint === "search" && nextSearchRegion) {
        return { ...instance, regionId: nextSearchRegion.id, updatedAt: now }
      }

      return instance
    })
  }

  async function reconcileInstancesForLayout(
    layoutId: string,
    currentInstances: PluginInstance[],
  ): Promise<PluginInstance[]> {
    const nextInstances = reassignInstancesForLayout(layoutId, currentInstances)
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
    return assignGridOrder(nextInstances)
  }

  async function switchLayout(layoutId: string) {
    const activeWorkspace = requireWorkspace(workspaceState())
    setCtxMenu(null)
    setExpandState(null)
    const nextInstances = await reconcileInstancesForLayout(layoutId, instances())
    setInstances(nextInstances)
    setActiveLayoutId(layoutId)

    const updatedWorkspace = await updateWorkspaceRecord({
      workspaceRepo,
      workspaceId: activeWorkspace.id,
      mutator(workspace) {
        workspace.activeLayoutId = layoutId
        workspace.regions = buildWorkspaceRegionState(layoutId, nextInstances)
        return workspace
      },
    })

    if (updatedWorkspace) {
      setWorkspaceState(updatedWorkspace)
    }
  }

  function pluginSummaries(): SettingsPanelViewProps["plugins"] {
    return pluginCatalog.pluginSummaries()
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

  function openSettings(panelId?: string) {
    const panels = pluginCatalog.listSettingsPanels()
    setActiveSettingsSectionId(resolveInitialSettingsSectionId(panels, panelId))
    setSettingsOpen(true)
  }

  async function setDefaultSearchProvider(providerId: string) {
    if (!searchProviders().some((provider) => provider.id === providerId)) {
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
    if (!searchProviders().some((provider) => provider.id === providerId)) {
      console.warn(`Unknown search provider: "${providerId}"`)
      return
    }
    await updateWorkspace((workspace) => {
      const currentSearch = (workspace.config?.search as Record<string, unknown>) ?? {}
      const currentEnabled = (
        Array.isArray(currentSearch.enabledProviderIds)
          ? currentSearch.enabledProviderIds
          : searchProviders().map((p) => p.id)
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
      const currentEnabled = prev.enabledProviderIds ?? searchProviders().map((p) => p.id)
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
    const nextInstances = await reconcileInstancesForLayout(
      result.workspace.activeLayoutId,
      result.instances,
    )
    setInstances(nextInstances)
    setActiveLayoutId(result.workspace.activeLayoutId)
    setThemeId(result.workspace.activeThemeId)
    applyThemeTokens(
      document.documentElement,
      resolveThemeTokens(result.workspace.activeThemeId, themes()),
    )
    const importedBackgroundId =
      result.workspace.activeBackgroundProviderId ?? FALLBACK_BACKGROUND_ID
    setBackgroundId(importedBackgroundId)
    applyBackgroundStyle(resolveBackgroundStyle(importedBackgroundId, backgrounds()))
    setSearchSettings(readSearchSettings(result.workspace, searchProviders()))
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
      searchProviders: searchProviders(),
      workspaceId: id,
    })
    setCtxMenu(null)
    setExpandState(null)
    setWorkspaceState(session.workspace)
    setActiveLayoutId(session.activeLayoutId)
    setThemeId(session.activeThemeId)
    const allThemes = themes()
    applyThemeTokens(document.documentElement, resolveThemeTokens(session.activeThemeId, allThemes))
    const allBg = backgrounds()
    const bg = session.activeBackgroundId
    setBackgroundId(bg)
    applyBackgroundStyle(resolveBackgroundStyle(bg, allBg))
    setSearchSettings(session.searchSettings)
    setSearchHistory(session.searchHistory)
    const nextInstances = await reconcileInstancesForLayout(
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

  function getWorkspaceList(): Workspace[] {
    return workspaceList()
  }

  function buildSettingsPanelProps(panel: {
    id: string
    pluginId: string
  }): SettingsPanelViewProps {
    const workspace = workspaceState()
    if (!workspace) {
      throw new Error("Workspace is not ready")
    }
    return {
      panelId: panel.id,
      pluginId: panel.pluginId,
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
      workspace,
      workspaces: getWorkspaceList(),
      layouts: layouts(),
      themes: themes(),
      backgrounds: backgrounds(),
      searchProviders: searchProviders(),
      searchSettings: searchSettings(),
      plugins: pluginSummaries(),
    }
  }

  async function switchTheme(newThemeId: string) {
    const activeWorkspace = requireWorkspace(workspaceState())
    const tokens = resolveThemeTokens(newThemeId, themes())
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
    applyBackgroundStyle(resolveBackgroundStyle(bgId, backgrounds()))
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

  function widgetContribution(instance: Pick<PluginInstance, "pluginId" | "contributionId">) {
    return pluginCatalog.findWidgetContribution(instance.pluginId, instance.contributionId)
  }

  function widgetCardView(instance: PluginInstance): SolidView | null {
    const widget = widgetContribution(instance)
    if (!widget) return null
    return viewOrUndefined(widget.views.card) ?? null
  }

  function widgetTitle(instance: Pick<PluginInstance, "pluginId" | "contributionId">): string {
    return widgetContribution(instance)?.title ?? instance.contributionId
  }

  function renderWidgetIcon(icon?: string): JSX.Element {
    switch (icon) {
      case "target":
        return <Target size={14} />
      case "link":
        return <Link2 size={14} />
      case "pencil":
        return <Pencil size={14} />
      case "check-square":
        return <CheckSquare size={14} />
      case "sun":
        return <Sun size={14} />
      default:
        return <Clock size={14} />
    }
  }

  function widgetIconLabel(icon?: string): string {
    switch (icon) {
      case "target":
        return "◎"
      case "link":
        return "↗"
      case "pencil":
        return "✎"
      case "check-square":
        return "✓"
      case "sun":
        return "☼"
      default:
        return "▦"
    }
  }

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

  function isInteractiveElement(target: EventTarget | null): boolean {
    return (
      target instanceof HTMLElement &&
      target.closest(
        "button, input, textarea, select, a, [role='button'], [data-prevent-expand='true']",
      ) !== null
    )
  }

  function resolveExpandView(instance: PluginInstance): {
    viewId: string
    mode: "card" | "modal" | "fullscreen"
  } | null {
    const widget = widgetContribution(instance)
    if (!widget) return null
    if (widget.views.fullscreen && kernel.registry.views.has(widget.views.fullscreen)) {
      return { viewId: widget.views.fullscreen, mode: "fullscreen" }
    }
    if (widget.views.modal && kernel.registry.views.has(widget.views.modal)) {
      return { viewId: widget.views.modal, mode: "modal" }
    }
    if (kernel.registry.views.has(widget.views.card)) {
      return { viewId: widget.views.card, mode: "card" }
    }
    return null
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
    const target = resolveExpandView(instance)
    if (!target) {
      showToast(`当前卡片暂不支持展开：${widgetTitle(instance)}`)
      return
    }
    lastExpandTrigger =
      trigger ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null)
    setCtxMenu(null)
    setExpandState({
      instanceId: instance.id,
      title: widgetTitle(instance),
      viewId: target.viewId,
      mode: target.mode,
      props: buildWidgetViewProps(instance),
    })
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

  function regionInstances(regionId: string, extensionPoint?: PluginInstance["extensionPoint"]) {
    return instances()
      .filter(
        (instance) =>
          instance.regionId === regionId &&
          (extensionPoint ? instance.extensionPoint === extensionPoint : true),
      )
      .sort(
        (left, right) =>
          (left.grid?.x ?? 0) - (right.grid?.x ?? 0) ||
          left.createdAt.localeCompare(right.createdAt),
      )
  }

  function widgetInstancesForRegion(regionId: string) {
    return regionInstances(regionId, "widget")
  }

  function widgetInstanceById(instanceId: string): PluginInstance | undefined {
    return instances().find((instance) => instance.id === instanceId)
  }

  function contextMenuInstance(): PluginInstance | null {
    const menu = ctxMenu()
    if (!menu) return null
    return widgetInstanceById(menu.instanceId) ?? null
  }

  function supportedWidgetSizes(instance: PluginInstance | null): WidgetSize[] {
    if (!instance) return ["S", "M", "L"]
    return widgetContribution(instance)?.supportedSizes ?? ["S", "M", "L"]
  }

  function focusWidgetInstance(instanceId: string) {
    const card = document.querySelector<HTMLElement>(`[data-widget-instance-id="${instanceId}"]`)
    if (!card) return
    card.scrollIntoView({ behavior: "smooth", block: "center" })
    card.focus()
    showToast("已定位到对应卡片")
  }

  function searchableWidgets(): SearchWidgetEntry[] {
    return instances()
      .filter((instance) => instance.extensionPoint === "widget")
      .map((instance) => {
        const widget = widgetContribution(instance)
        const title = widget?.title ?? instance.contributionId
        return {
          instanceId: instance.id,
          icon: widgetIconLabel(widget?.icon),
          name: title,
          desc: `定位到 ${title} 卡片`,
          action: () => focusWidgetInstance(instance.id),
        }
      })
  }

  async function persistGridOrder(regionId: string, orderedInstances: PluginInstance[]) {
    const nextRegionInstances = assignGridOrder(orderedInstances)
    const nextById = new Map(nextRegionInstances.map((instance) => [instance.id, instance]))
    const mergedInstances = instances().map((instance) => nextById.get(instance.id) ?? instance)

    for (const instance of nextRegionInstances) {
      await instanceRepo.save(instance)
    }

    setInstances(mergedInstances)
  }

  function onDrop(e: DragEvent, targetId: string, regionId: string) {
    e.preventDefault()
    const sourceId = dragId()
    if (!sourceId || sourceId === targetId) return
    setDragId(null)
    const list = [...widgetInstancesForRegion(regionId)]
    const fromIdx = list.findIndex((i) => i.id === sourceId)
    const toIdx = list.findIndex((i) => i.id === targetId)
    if (fromIdx === -1 || toIdx === -1) return
    const [moved] = list.splice(fromIdx, 1)
    list.splice(toIdx, 0, moved!)
    void persistGridOrder(regionId, list)
    showToast("排序已更新")
  }

  const availableWidgets = () => {
    return pluginCatalog.listWidgetContributions()
  }

  function enabledProviderIds(): string[] {
    const settings = searchSettings()
    if (settings.enabledProviderIds) return settings.enabledProviderIds
    return searchProviders().map((p) => p.id)
  }

  function enabledSearchProviders(): SearchProviderContribution[] {
    const ids = new Set(enabledProviderIds())
    return searchProviders().filter((p) => ids.has(p.id))
  }

  function resolveDefaultProviderForSearch(): string {
    const settings = searchSettings()
    if (settings.defaultProviderId) return settings.defaultProviderId
    const enabled = enabledSearchProviders()
    if (enabled[0]) return enabled[0].id
    return ""
  }

  function openExternal(url: string): boolean {
    kernel.events.emit("host.external.open", { url })
    return true
  }

  function renderAddWidgetModal() {
    return (
      <Show when={addWidgetOpen()}>
        <div class="modal-overlay" onClick={() => setAddWidgetOpen(false)}>
          <div class="modal-container" onClick={(e) => e.stopPropagation()}>
            <div class="modal-title">添加卡片</div>
            <div class="modal-body">
              <For each={availableWidgets()}>
                {(w) => {
                  return (
                    <button
                      class="add-widget-modal-item"
                      onClick={() => {
                        void addWidget(w.pluginId, w.id)
                        setAddWidgetOpen(false)
                      }}
                    >
                      <span class="add-widget-modal-icon">{widgetIconLabel(w.icon)}</span>
                      <span class="add-widget-modal-info">
                        <div class="add-widget-modal-name">{w.title}</div>
                        <div class="add-widget-modal-desc">{w.description}</div>
                      </span>
                    </button>
                  )
                }}
              </For>
            </div>
          </div>
        </div>
      </Show>
    )
  }

  function runRailAction(actionId: string) {
    if (actionId === "add-widget") {
      setAddWidgetOpen(true)
    } else if (actionId === "theme") {
      void switchTheme(isDark() ? "official.theme.light" : "official.theme.dark")
    } else if (actionId === "settings") {
      openSettings("official.settings.workspace.appearance")
    } else if (actionId === "home") {
      if (composition.host.platform === "web") {
        window.scrollTo({ top: 0, behavior: "smooth" })
      }
    }
  }

  function renderSafeLayout() {
    // Built-in safe layout: single-column stream of all cards with minimal toolbar
    return (
      <div class="safe-layout">
        <div class="safe-layout-toolbar">
          <span class="toolbar-logo">
            <TaboraMark class="toolbar-logo-mark" />
            <span>Tabora</span>
          </span>
          <div style={{ flex: 1 }} />
          <button class="toolbar-btn" onClick={() => setCmdPaletteOpen(true)}>
            搜索
          </button>
          <button
            class="toolbar-btn"
            aria-label={isDark() ? "切换到明亮主题" : "切换到暗色主题"}
            onClick={() =>
              void switchTheme(isDark() ? "official.theme.light" : "official.theme.dark")
            }
          >
            {isDark() ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button class="toolbar-btn" onClick={() => openSettings()}>
            设置
          </button>
        </div>
        <div class="safe-layout-stream">
          <For each={instances()}>
            {(instance) => {
              const widget = widgetContribution(instance)
              const title = widget?.title ?? instance.contributionId
              const View = widgetCardView(instance)
              if (!View) return null

              return (
                <WidgetCardShell
                  instance={instance}
                  title={title}
                  icon={renderWidgetIcon(widget?.icon)}
                  supportedSizes={widget?.supportedSizes ?? ["S", "M", "L"]}
                  currentSize={instance.size ?? "M"}
                  callbacks={{
                    onDragStart: () => setDragId(instance.id),
                    onDragOver: (e: DragEvent) => {
                      e.preventDefault()
                      e.dataTransfer!.dropEffect = "move"
                    },
                    onDrop: () => setDragId(null),
                    onDblClick: () => openWidgetExpand(instance),
                    onContextMenu: (e: MouseEvent) => {
                      e.preventDefault()
                      setCtxMenu({ x: e.clientX, y: e.clientY, instanceId: instance.id })
                    },
                    onResize: (size: WidgetSize) => changeWidgetSize(instance.id, size),
                    onRemove: () => removeWidget(instance.id),
                    onExpand: () => openWidgetExpand(instance),
                    isDragging: dragId() === instance.id,
                  }}
                >
                  <PluginViewBoundary instanceId={instance.id} title={title}>
                    {View(buildWidgetViewProps(instance))}
                  </PluginViewBoundary>
                </WidgetCardShell>
              )
            }}
          </For>
        </div>
      </div>
    )
  }

  function renderActiveLayout() {
    const layout = pluginCatalog.findLayoutContribution(activeLayoutId())
    const LayoutView = layout?.view ? viewOrUndefined(layout.view) : undefined

    if (!LayoutView) {
      return renderSafeLayout()
    }

    const regions = layoutEngine.buildRegionSlots(activeLayoutId(), instances())
    const host = layoutEngine.buildHostAPI()

    return (
      <LayoutBoundary
        fallback={renderSafeLayout()}
        onError={(error) => {
          console.error("Layout error:", error)
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

  const isDark = () => themeId() === "official.theme.dark"

  return (
    <div
      class="tabora-root"
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
          e.preventDefault()
          setCmdPaletteOpen(true)
        }
        if ((e.metaKey || e.ctrlKey) && e.key === "t") {
          e.preventDefault()
          void switchTheme(isDark() ? "official.theme.light" : "official.theme.dark")
        }
        if ((e.metaKey || e.ctrlKey) && e.key === ",") {
          e.preventDefault()
          openSettings("official.settings.workspace.appearance")
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
        {renderAddWidgetModal()}
        <SettingsHost
          open={settingsOpen()}
          panels={pluginCatalog.listSettingsPanels()}
          activeSectionId={activeSettingsSectionId()}
          onSectionChange={setActiveSettingsSectionId}
          onClose={() => setSettingsOpen(false)}
          getView={(viewId) => viewOrUndefined<SettingsPanelViewProps>(viewId)}
          panelProps={buildSettingsPanelProps}
          aboutContent={
            <div class="settings-panel-stack-host">
              <section class="widget-card">
                <div class="card-header">
                  <div class="card-title">
                    <span class="card-title-text">关于 Tabora</span>
                  </div>
                </div>
                <div class="card-body">
                  <p>当前实现已切换到双布局工作台骨架，设置中心按固定分类组织插件设置内容。</p>
                  <p>当前工作区：{workspaceState()?.name ?? "未加载"}。</p>
                  <p>
                    已启用官方插件：{pluginSummaries().filter((plugin) => plugin.enabled).length}。
                  </p>
                </div>
              </section>
            </div>
          }
        />
        <Show when={expandState()}>
          {(expand) => (
            <div class="expand-overlay" onClick={closeExpand}>
              <div
                class="expand-shell"
                classList={{
                  "is-card-fallback": expand().mode === "card",
                  "is-fullscreen": expand().mode === "fullscreen",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div class="expand-header">
                  <div class="expand-title">
                    <span class="expand-title-icon">
                      {renderWidgetIcon(widgetContribution(expand().props)?.icon)}
                    </span>
                    <div class="expand-title-texts">
                      <span class="expand-title-text">{expand().title}</span>
                      <span class="expand-title-meta">
                        {expand().mode === "fullscreen"
                          ? "全屏视图"
                          : expand().mode === "modal"
                            ? "插件展开视图"
                            : "卡片放大视图"}
                      </span>
                    </div>
                  </div>
                  <button class="expand-close-btn" onClick={closeExpand} aria-label="关闭展开视图">
                    <X size={18} />
                  </button>
                </div>
                <div class="expand-body">
                  {(() => {
                    const View = viewOrUndefined<WidgetViewProps>(expand().viewId)
                    if (!View) {
                      return (
                        <div class="settings-panel-missing" role="alert">
                          展开视图不可用：{expand().viewId}
                        </div>
                      )
                    }

                    return (
                      <PluginViewBoundary instanceId={expand().instanceId} title={expand().title}>
                        {View(expand().props)}
                      </PluginViewBoundary>
                    )
                  })()}
                </div>
                <div class="expand-footer">
                  <span class="expand-footer-meta">{expand().instanceId}</span>
                  <span class="expand-close-hint">Esc 关闭 · 双击打开 · 右键菜单</span>
                </div>
              </div>
            </div>
          )}
        </Show>
        <Show when={modalViewId()}>
          <div class="modal-overlay" onClick={() => setModalViewId(null)}>
            <div class="modal-container" onClick={(e) => e.stopPropagation()}>
              <button class="modal-close" aria-label="关闭" onClick={() => setModalViewId(null)}>
                <X size={16} />
              </button>
              <div class="modal-body">
                {(() => {
                  const viewId = modalViewId()
                  if (!viewId) return null
                  const View = kernel.registry.views.get(viewId) as SolidView
                  const props = modalProps()
                  return (
                    <PluginViewBoundary instanceId={pluginBoundaryId(props, viewId)} title={viewId}>
                      {View(props)}
                    </PluginViewBoundary>
                  )
                })()}
              </div>
            </div>
          </div>
        </Show>
        <Show when={fullscreenViewId()}>
          <div class="fullscreen-overlay">
            <button
              class="fullscreen-close"
              aria-label="关闭全屏视图"
              onClick={() => setFullscreenViewId(null)}
            >
              <X size={18} />
            </button>
            <div class="fullscreen-body">
              {(() => {
                const viewId = fullscreenViewId()
                if (!viewId) return null
                const View = kernel.registry.views.get(viewId) as SolidView
                const props = fullscreenProps()
                return (
                  <PluginViewBoundary instanceId={pluginBoundaryId(props, viewId)} title={viewId}>
                    {View(props)}
                  </PluginViewBoundary>
                )
              })()}
            </div>
          </div>
        </Show>
        <Show when={ctxMenu()}>
          {(menu) => (
            <div class="ctx-menu-overlay" onClick={() => setCtxMenu(null)}>
              <div class="ctx-menu-panel" style={{ left: `${menu().x}px`, top: `${menu().y}px` }}>
                <For each={supportedWidgetSizes(contextMenuInstance())}>
                  {(size) => (
                    <button
                      class="ctx-menu-item"
                      onClick={() => {
                        const instance = contextMenuInstance()
                        if (!instance) return
                        void changeWidgetSize(instance.id, size)
                        setCtxMenu(null)
                      }}
                    >
                      尺寸 {size}
                      <Show when={(contextMenuInstance()?.size ?? "M") === size}>
                        <span class="ctx-menu-check">当前</span>
                      </Show>
                    </button>
                  )}
                </For>
                <hr class="ctx-menu-sep" />
                <button
                  class="ctx-menu-item"
                  onClick={() => {
                    const instance = contextMenuInstance()
                    if (!instance) return
                    openWidgetExpand(instance)
                  }}
                >
                  展开详情
                </button>
                <hr class="ctx-menu-sep" />
                <button
                  class="ctx-menu-item ctx-menu-danger"
                  onClick={() => {
                    void removeWidget(menu().instanceId)
                    showToast("实例已移除")
                    setCtxMenu(null)
                  }}
                >
                  移除实例
                </button>
              </div>
            </div>
          )}
        </Show>
        <ToastHost toasts={toasts()} />
      </Show>
      <CommandPalette
        isOpen={cmdPaletteOpen()}
        onClose={() => setCmdPaletteOpen(false)}
        commands={commandItems()}
        widgets={searchableWidgets()}
        providers={enabledSearchProviders()}
        defaultProviderId={resolveDefaultProviderForSearch()}
        searchHistory={searchHistory()}
        openExternal={openExternal}
        onSaveHistory={saveSearchHistory}
      />
    </div>
  )
}
