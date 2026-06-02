import { createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import type {
  BackgroundProviderContribution,
  LayoutContribution,
  LayoutRegion,
  PluginInstance,
  SearchHistoryEntry,
  SearchProviderContribution,
  SearchViewProps,
  SettingsPanelViewProps,
  ThemeContribution,
  WidgetSize,
  WidgetViewProps,
  WorkbenchSearchSettings,
  Workspace,
} from "@tabora/plugin-api"
import { officialPlugins } from "@tabora/official-plugins"
import { createPluginKernel } from "@tabora/platform-kernel"
import { applyThemeTokens } from "@tabora/theme"
import {
  createInstanceRepository,
  createPluginDataRepository,
  createPluginRecordRepository,
  createTaboraDatabase,
  createWorkspaceRepository,
} from "@tabora/storage"
import { Clock, Link2, Pencil, Sun, Target, CheckSquare } from "lucide-solid"

import { PluginViewBoundary } from "./PluginViewBoundary"
import { CommandPalette } from "./CommandPalette"
import { assignGridOrder, gridColumnSpan } from "./workbenchGrid"
import { findLayoutContribution, findSearchContribution } from "./workbenchShell"
import {
  SettingsHost,
  collectSettingsPanels,
  resolveInitialSettingsSectionId,
  type SettingsSectionId,
} from "./settingsHost"
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

type SolidView<Props = Record<string, unknown>> = (props: Props) => JSX.Element

function findWidgetContribution(pluginId: string, contributionId: string) {
  const plugin = officialPlugins.find((p) => p.manifest.id === pluginId)
  return plugin?.manifest.contributes.widgets?.find((w) => w.id === contributionId)
}

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
  const [searchSettings, setSearchSettings] = createSignal<WorkbenchSearchSettings>({
    defaultProviderId: "",
  })
  const [modalViewId, setModalViewId] = createSignal<string | null>(null)
  const [modalProps, setModalProps] = createSignal<Record<string, unknown>>({})
  const [fullscreenViewId, setFullscreenViewId] = createSignal<string | null>(null)
  const [fullscreenProps, setFullscreenProps] = createSignal<Record<string, unknown>>({})
  const [dragId, setDragId] = createSignal<string | null>(null)
  const [ctxMenu, setCtxMenu] = createSignal<{ x: number; y: number; instanceId: string } | null>(
    null,
  )
  const [addWidgetOpen, setAddWidgetOpen] = createSignal(false)
  const [cmdPaletteOpen, setCmdPaletteOpen] = createSignal(false)
  const [toasts, setToasts] = createSignal<{ id: number; msg: string }[]>([])
  const [searchHistory, setSearchHistory] = createSignal<SearchHistoryEntry[]>([])
  let toastSeq = 0
  function showToast(msg: string) {
    const id = ++toastSeq
    setToasts((t) => [...t, { id, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500)
  }

  const commandItems = () => [
    {
      icon: "🎨",
      name: "切换主题",
      desc: isDark() ? "暗色 → 明亮" : "明亮 → 暗色",
      group: "命令" as const,
      shortcut: "⌘T",
      action: () => switchTheme(isDark() ? "official.theme.light" : "official.theme.dark"),
    },
    {
      icon: "⇄",
      name: "切换布局",
      desc:
        activeLayoutId() === "official.layout.workbench-dashboard"
          ? "仪表盘 → 流式"
          : "流式 → 仪表盘",
      group: "命令" as const,
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
      icon: "+",
      name: "添加卡片",
      desc: "向工作台添加新卡片",
      group: "命令" as const,
      shortcut: "⌘N",
      action: () => setAddWidgetOpen(true),
    },
    {
      icon: "⚙",
      name: "打开设置",
      desc: "配置工作台",
      group: "命令" as const,
      shortcut: "⌘,",
      action: () => openSettings("official.settings.workspace.appearance"),
    },
    {
      icon: "?",
      name: "快捷键参考",
      desc: "查看所有快捷键",
      group: "命令" as const,
      action: () => {},
    },
  ]

  const database = createTaboraDatabase()
  const workspaceRepo = createWorkspaceRepository(database)
  const instanceRepo = createInstanceRepository(database)
  const pluginDataRepo = createPluginDataRepository(database)
  const pluginRecordRepo = createPluginRecordRepository(database)

  const kernel = createPluginKernel({
    lifecycleStore: pluginRecordRepo,
    recordSource: "builtin",
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

  void kernel.discover(officialPlugins).then(async () => {
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
    return officialPlugins.flatMap((plugin) => plugin.manifest.contributes.themes ?? [])
  }

  function searchProviders(): SearchProviderContribution[] {
    return officialPlugins.flatMap((plugin) => plugin.manifest.contributes.searchProviders ?? [])
  }

  function backgrounds(): BackgroundProviderContribution[] {
    return officialPlugins.flatMap(
      (plugin) => plugin.manifest.contributes.backgroundProviders ?? [],
    )
  }

  function layouts(): LayoutContribution[] {
    return officialPlugins.flatMap((plugin) => plugin.manifest.contributes.layouts ?? [])
  }

  function layoutRegions(layoutId = activeLayoutId()): LayoutRegion[] {
    return findLayoutContribution(officialPlugins, layoutId)?.regions ?? []
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
    return officialPlugins.map((plugin) => ({
      id: plugin.manifest.id,
      name: plugin.manifest.name,
      version: plugin.manifest.version,
      enabled: plugin.enabled,
      permissions: plugin.manifest.permissions ?? [],
      contributes: plugin.manifest.contributes,
    }))
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
    const panels = collectSettingsPanels(officialPlugins)
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
      availablePluginIds: officialPlugins.map((p) => p.manifest.id),
    })

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

  function widgetCardView(contributionId: string): SolidView | null {
    const plugin = officialPlugins.find((p) =>
      p.manifest.contributes.widgets?.some((w) => w.id === contributionId),
    )
    if (!plugin) return null
    const widget = plugin.manifest.contributes.widgets!.find((w) => w.id === contributionId)!
    return kernel.registry.views.get(widget.views.card) as SolidView
  }

  function widgetTitle(contributionId: string): string {
    for (const plugin of officialPlugins) {
      const widget = plugin.manifest.contributes.widgets?.find((w) => w.id === contributionId)
      if (widget) return widget.title
    }
    return contributionId
  }

  const widgetIcons: Record<string, () => JSX.Element> = {
    "today-focus": () => <Target size={14} />,
    "quick-links": () => <Link2 size={14} />,
    notes: () => <Pencil size={14} />,
    todo: () => <CheckSquare size={14} />,
    weather: () => <Sun size={14} />,
  }

  const widgetDescriptors: Record<string, { icon: string; desc: string }> = {
    "today-focus": { icon: "🎯", desc: "记录今日最重要的任务" },
    "quick-links": { icon: "🔗", desc: "快速访问常用网站" },
    notes: { icon: "📝", desc: "随手记下想法和灵感" },
    todo: { icon: "✅", desc: "管理待办事项列表" },
    weather: { icon: "🌤", desc: "查看本地天气" },
  }

  function findWidgetPluginId(contributionId: string): string | null {
    for (const plugin of officialPlugins) {
      if (plugin.manifest.contributes.widgets?.some((w) => w.id === contributionId)) {
        return plugin.manifest.id
      }
    }
    return null
  }

  async function addWidget(contributionId: string) {
    const workspace = requireWorkspace(workspaceState())
    const pluginId = findWidgetPluginId(contributionId)
    if (!pluginId) return
    const widget = findWidgetContribution(pluginId, contributionId)
    if (!widget) return
    const widgetRegionId =
      layoutRegions().find((region) => region.accepts.includes("widget"))?.id ?? "mainGrid"
    const id = `${contributionId}-${Date.now()}`
    const inst: PluginInstance = {
      id,
      workspaceId: workspace.id,
      pluginId,
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
      },
      updatedAt: new Date().toISOString(),
    }
    await instanceRepo.save(updated)
    setInstances((prev) => prev.map((i) => (i.id === instanceId ? updated : i)))
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

  function searchInstancesForRegion(regionId: string) {
    return regionInstances(regionId, "search")
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
    const contributions: {
      id: string
      pluginId: string
      title: string
      defaultSize: WidgetSize
    }[] = []
    for (const plugin of officialPlugins) {
      for (const widget of plugin.manifest.contributes.widgets ?? []) {
        contributions.push({
          id: widget.id,
          pluginId: plugin.manifest.id,
          title: widget.title,
          defaultSize: widget.defaultSize,
        })
      }
    }
    return contributions
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

  function renderSearchRegion(regionId: string) {
    const searchInstances = searchInstancesForRegion(regionId)
    if (searchInstances.length === 0) {
      return <div class="settings-empty">当前布局未放置搜索插件</div>
    }

    return (
      <For each={searchInstances}>
        {(instance) => {
          const search = findSearchContribution(
            officialPlugins,
            instance.pluginId,
            instance.contributionId,
          )
          if (!search) return null
          const View = viewOrUndefined<SearchViewProps>(search.view)
          if (!View) {
            return <div class="settings-empty">搜索视图不可用：{search.id}</div>
          }

          return (
            <PluginViewBoundary instanceId={instance.id} title={search.title}>
              {View({
                providers: enabledSearchProviders(),
                defaultProviderId: resolveDefaultProviderForSearch(),
                openExternal,
                onDefaultProviderChange: setDefaultSearchProvider,
                searchHistory: searchHistory(),
                onSaveHistory: saveSearchHistory,
                onClearHistory: clearSearchHistory,
              })}
            </PluginViewBoundary>
          )
        }}
      </For>
    )
  }

  function renderMainGrid(regionId: string) {
    return (
      <>
        <section class="workbench-grid">
          <For each={widgetInstancesForRegion(regionId)}>
            {(inst) => {
              const View = widgetCardView(inst.contributionId)
              if (!View) return null
              const widget = findWidgetContribution(inst.pluginId, inst.contributionId)
              const span = gridColumnSpan(inst.size)
              return (
                <div
                  class={`grid-item`}
                  classList={{ dragging: dragId() === inst.id }}
                  style={{ "grid-column": `span ${span}` }}
                  aria-label={widgetTitle(inst.contributionId)}
                  draggable="true"
                  onDragStart={(e) => onDragStart(e, inst.id)}
                  onDragOver={onDragOver}
                  onDrop={(e) => onDrop(e, inst.id, regionId)}
                  onDblClick={() => {
                    const w = findWidgetContribution(inst.pluginId, inst.contributionId)
                    const modalViewId = w?.views.modal
                    if (modalViewId && kernel.registry.views.has(modalViewId)) {
                      kernel.events.emit("ui.modal.open", {
                        viewId: modalViewId,
                        props: {
                          instanceId: inst.id,
                          pluginId: inst.pluginId,
                          contributionId: inst.contributionId,
                          config: inst.config,
                          data: makeScopedData(inst.pluginId, inst.id),
                        },
                      })
                      showToast("展开卡片：" + widgetTitle(inst.contributionId))
                    }
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault()
                    setCtxMenu({ x: e.clientX, y: e.clientY, instanceId: inst.id })
                  }}
                >
                  <div class="widget-card">
                    <div class="card-header">
                      <div class="card-title">
                        {(widgetIcons[inst.contributionId] ?? (() => <Clock size={14} />))()}
                        <span class="card-title-text">{widgetTitle(inst.contributionId)}</span>
                      </div>
                      <div class="card-actions">
                        <div class="widget-size-bar">
                          {(widget?.supportedSizes ?? ["S", "M", "L"]).map((s) => (
                            <button
                              class="widget-size-btn"
                              classList={{ active: (inst.size ?? "M") === s }}
                              onClick={() => changeWidgetSize(inst.id, s)}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                        <button
                          class="card-action-btn card-danger"
                          onClick={() => removeWidget(inst.id)}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                    <div class="card-body">
                      <PluginViewBoundary
                        instanceId={inst.id}
                        title={widgetTitle(inst.contributionId)}
                      >
                        {View({
                          instanceId: inst.id,
                          pluginId: inst.pluginId,
                          contributionId: inst.contributionId,
                          config: inst.config,
                          data: makeScopedData(inst.pluginId, inst.id),
                        } satisfies WidgetViewProps)}
                      </PluginViewBoundary>
                    </div>
                  </div>
                </div>
              )
            }}
          </For>
        </section>
        <section class="add-widgets" id="add-widgets" tabIndex={-1}>
          <button class="add-widget-trigger" onClick={() => setAddWidgetOpen(true)}>
            + 添加卡片
          </button>
          <Show when={addWidgetOpen()}>
            <div class="modal-overlay" onClick={() => setAddWidgetOpen(false)}>
              <div class="modal-container" onClick={(e) => e.stopPropagation()}>
                <div class="modal-title">添加卡片</div>
                <div class="modal-body">
                  <For each={availableWidgets()}>
                    {(w) => {
                      const desc = widgetDescriptors[w.id] ?? { icon: "▦", desc: "" }
                      return (
                        <button
                          class="add-widget-modal-item"
                          onClick={() => {
                            void addWidget(w.id)
                            setAddWidgetOpen(false)
                          }}
                        >
                          <span class="add-widget-modal-icon">{desc.icon}</span>
                          <span class="add-widget-modal-info">
                            <div class="add-widget-modal-name">{w.title}</div>
                            <div class="add-widget-modal-desc">{desc.desc}</div>
                          </span>
                        </button>
                      )
                    }}
                  </For>
                </div>
              </div>
            </div>
          </Show>
        </section>
      </>
    )
  }

  function runRailAction(actionId: string) {
    if (actionId === "add-widget") {
      setAddWidgetOpen(true)
    } else if (actionId === "plugins") {
      setActiveSettingsSectionId("plugins")
      setSettingsOpen(true)
    } else if (actionId === "settings") {
      setActiveSettingsSectionId("appearance")
      setSettingsOpen(true)
    } else if (actionId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }

  function renderActiveLayout() {
    const layout = findLayoutContribution(officialPlugins, activeLayoutId())
    const LayoutView = layout?.view ? viewOrUndefined(layout.view) : undefined

    if (!LayoutView) {
      const fallbackRegionId =
        layoutRegions().find((region) => region.accepts.includes("widget"))?.id ?? "mainGrid"
      return <>{renderMainGrid(fallbackRegionId)}</>
    }

    const isDashboard = activeLayoutId() === "official.layout.workbench-dashboard"
    const isStream = activeLayoutId() === "official.layout.workbench-stream"

    if (isDashboard) {
      const rail = (
        <nav class="workbench-rail" aria-label="工作台导航">
          <div class="rail-logo">T</div>
          <button
            class="rail-btn active"
            aria-label="主页"
            onClick={() => runRailAction("home")}
            type="button"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </button>
          <button
            class="rail-btn"
            aria-label="添加卡片"
            onClick={() => runRailAction("add-widget")}
            type="button"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>
          <div style={{ flex: 1 }} />
          <button
            class="rail-btn"
            aria-label="切换主题"
            onClick={() => switchTheme(isDark() ? "official.theme.light" : "official.theme.dark")}
            type="button"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
            </svg>
          </button>
          <button
            class="rail-btn"
            aria-label="设置"
            onClick={() => runRailAction("settings")}
            type="button"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
        </nav>
      )
      const topbar = (
        <div class="topbar">
          <div class="dash-greeting">
            <span>
              {(() => {
                const h = new Date().getHours()
                return h < 12 ? "早上好" : h < 18 ? "下午好" : "晚上好"
              })()}{" "}
              <span class="dash-greeting-muted">
                · {new Date().getMonth() + 1}月{new Date().getDate()}日 星期
                {["日", "一", "二", "三", "四", "五", "六"][new Date().getDay()]}
              </span>
            </span>
            <button class="btn btn-subtle btn-sm" onClick={() => setAddWidgetOpen(true)}>
              + 添加卡片
            </button>
          </div>
          {renderSearchRegion("topbar")}
        </div>
      )
      return LayoutView({ rail, topbar, mainGrid: renderMainGrid("mainGrid") })
    }

    if (isStream) {
      const toolbar = (
        <div class="stream-topbar">
          <span class="stream-topbar-logo">
            Tabora <span>Stream</span>
          </span>
          <div style={{ flex: 1 }} />
          <button class="toolbar-btn" onClick={() => setCmdPaletteOpen(true)}>
            ⌘K 搜索
          </button>
          <button class="toolbar-btn" onClick={() => runRailAction("settings")}>
            ⚙ 设置
          </button>
        </div>
      )
      return LayoutView({
        toolbar,
        stream: (
          <>
            <div class="stream-hero">
              <div class="stream-hero-greeting">下午好 ☀</div>
              <div class="stream-hero-date">2026年5月30日 · 北京</div>
            </div>
            {renderMainGrid("stream")}
          </>
        ),
      })
    }

    const fallbackRegionId =
      layoutRegions().find((region) => region.accepts.includes("widget"))?.id ?? "mainGrid"
    return <>{renderMainGrid(fallbackRegionId)}</>
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
          setCtxMenu(null)
          setAddWidgetOpen(false)
        }
      }}
      tabIndex={-1}
    >
      <Show when={kernelReady()} fallback={<div class="loading">Loading Tabora...</div>}>
        <div class="toolbar">
          <div class="toolbar-left">
            <span class="toolbar-logo">Tabora</span>
            <span class="toolbar-badge">{instances().length} 实例</span>
          </div>
          <div class="toolbar-right">
            <button
              class="toolbar-btn"
              classList={{ active: activeLayoutId() === "official.layout.workbench-dashboard" }}
              onClick={() => void switchLayout("official.layout.workbench-dashboard")}
            >
              仪表盘
            </button>
            <button
              class="toolbar-btn"
              classList={{ active: activeLayoutId() === "official.layout.workbench-stream" }}
              onClick={() => void switchLayout("official.layout.workbench-stream")}
            >
              流式
            </button>
            <span class="toolbar-sep" />
            <button
              class="toolbar-btn"
              onClick={() => switchTheme(isDark() ? "official.theme.light" : "official.theme.dark")}
              aria-label="切换主题"
            >
              {isDark() ? "☀" : "☾"}
            </button>
            <button
              class="toolbar-btn"
              onClick={() => openSettings("official.settings.workspace.appearance")}
              aria-label="设置"
            >
              ⚙
            </button>
          </div>
        </div>
        {renderActiveLayout()}
        <SettingsHost
          open={settingsOpen()}
          panels={collectSettingsPanels(officialPlugins)}
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
        <Show when={modalViewId()}>
          <div class="modal-overlay" onClick={() => setModalViewId(null)}>
            <div class="modal-container" onClick={(e) => e.stopPropagation()}>
              <button class="modal-close" onClick={() => setModalViewId(null)}>
                ×
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
            <button class="fullscreen-close" onClick={() => setFullscreenViewId(null)}>
              ×
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
                <button
                  class="ctx-menu-item"
                  onClick={() => {
                    setCtxMenu(null)
                  }}
                >
                  尺寸 S
                </button>
                <button
                  class="ctx-menu-item"
                  onClick={() => {
                    setCtxMenu(null)
                  }}
                >
                  尺寸 M
                </button>
                <button
                  class="ctx-menu-item"
                  onClick={() => {
                    setCtxMenu(null)
                  }}
                >
                  尺寸 L
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
        <Show when={toasts().length > 0}>
          <div class="toast-stack">
            <For each={toasts()}>{(t) => <div class="toast-item">{t.msg}</div>}</For>
          </div>
        </Show>
      </Show>
      <CommandPalette
        isOpen={cmdPaletteOpen()}
        onClose={() => setCmdPaletteOpen(false)}
        commands={commandItems()}
      />
    </div>
  )
}
