import { createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import type {
  BackgroundProviderContribution,
  PluginInstance,
  SearchHistoryEntry,
  SearchProviderContribution,
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
import { PluginViewBoundary } from "./PluginViewBoundary"
import { assignGridOrder, gridColumnSpan } from "./workbenchGrid"
import { WORKBENCH_RAIL_ACTIONS, findLayoutContribution } from "./workbenchShell"
import { SettingsHost, collectSettingsPanels, resolveInitialSettingsPanelId } from "./settingsHost"
import { createDefaultWorkspaceSeed, OFFICIAL_DEFAULT_WORKSPACE_SEED } from "./defaultWorkspaceSeed"
import { resolveThemeTokens } from "./themeResolver"
import {
  applyBackgroundStyle,
  resolveBackgroundStyle,
  FALLBACK_BACKGROUND_ID,
} from "./backgroundResolver"

type SolidView<Props = Record<string, unknown>> = (props: Props) => JSX.Element

function findWidgetContribution(pluginId: string, contributionId: string) {
  const plugin = officialPlugins.find((p) => p.manifest.id === pluginId)
  return plugin?.manifest.contributes.widgets?.find((w) => w.id === contributionId)
}

function pluginBoundaryId(props: Record<string, unknown>, fallback: string): string {
  return typeof props.instanceId === "string" ? props.instanceId : fallback
}

export function App() {
  const [kernelReady, setKernelReady] = createSignal(false)
  const [instances, setInstances] = createSignal<PluginInstance[]>([])
  const [activeLayoutId, setActiveLayoutId] = createSignal("official.layout.workbench-dashboard")
  const [themeId, setThemeId] = createSignal("official.theme.light")
  const [backgroundId, setBackgroundId] = createSignal(FALLBACK_BACKGROUND_ID)
  const [workspaceState, setWorkspaceState] = createSignal<Workspace | null>(null)
  const [workspaceList, setWorkspaceList] = createSignal<Workspace[]>([])
  const [settingsOpen, setSettingsOpen] = createSignal(false)
  const [activeSettingsPanelId, setActiveSettingsPanelId] = createSignal<string | null>(null)
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
  const [toasts, setToasts] = createSignal<{ id: number; msg: string }[]>([])
  const [searchHistory, setSearchHistory] = createSignal<SearchHistoryEntry[]>([])
  let toastSeq = 0
  function showToast(msg: string) {
    const id = ++toastSeq
    setToasts((t) => [...t, { id, msg }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500)
  }

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

    let workspace = await workspaceRepo.get("default")
    if (!workspace) {
      const seed = createDefaultWorkspaceSeed(OFFICIAL_DEFAULT_WORKSPACE_SEED)
      workspace = seed.workspace
      await workspaceRepo.save(workspace)
    }

    setWorkspaceState(workspace)
    setSearchSettings(readSearchSettings(workspace, searchProviders()))
    setActiveLayoutId(workspace.activeLayoutId)
    setThemeId(workspace.activeThemeId)

    const allThemes = themes()
    const tokens = resolveThemeTokens(workspace.activeThemeId, allThemes)
    applyThemeTokens(document.documentElement, tokens)

    const allBackgrounds = backgrounds()
    const savedBg = workspace.activeBackgroundProviderId ?? FALLBACK_BACKGROUND_ID
    setBackgroundId(savedBg)
    applyBackgroundStyle(resolveBackgroundStyle(savedBg, allBackgrounds))

    const savedHistory = await pluginDataRepo.get<SearchHistoryEntry[]>(
      "official.search.command-bar",
      "search-history",
    )
    if (savedHistory) setSearchHistory(savedHistory)

    let loaded = await instanceRepo.getByRegion("mainGrid")
    if (loaded.length === 0) {
      const seed = createDefaultWorkspaceSeed(OFFICIAL_DEFAULT_WORKSPACE_SEED)
      loaded = assignGridOrder(seed.instances.filter((i) => i.regionId === "mainGrid"))
      for (const inst of loaded) {
        await instanceRepo.save(inst)
      }
    }
    setInstances(loaded)
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

  function readSearchSettings(
    workspace: Workspace,
    providers: SearchProviderContribution[],
  ): WorkbenchSearchSettings {
    const saved = workspace.config?.search as Record<string, unknown> | undefined
    const defaultProviderId =
      typeof saved?.defaultProviderId === "string"
        ? saved.defaultProviderId
        : (providers[0]?.id ?? "")

    let enabledProviderIds: string[] | undefined
    if (Array.isArray(saved?.enabledProviderIds)) {
      enabledProviderIds = saved.enabledProviderIds as string[]
    }

    const result: WorkbenchSearchSettings = { defaultProviderId }
    if (enabledProviderIds) {
      result.enabledProviderIds = enabledProviderIds
    }
    return result
  }

  async function updateWorkspace(mutator: (workspace: Workspace) => Workspace) {
    const current = await workspaceRepo.get("default")
    if (!current) return
    const updated = mutator({ ...current, config: { ...(current.config ?? {}) } })
    updated.updatedAt = new Date().toISOString()
    await workspaceRepo.save(updated)
    setWorkspaceState(updated)
  }

  function openSettings(panelId?: string) {
    const panels = collectSettingsPanels(officialPlugins)
    setActiveSettingsPanelId(resolveInitialSettingsPanelId(panels, panelId))
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
    await pluginDataRepo.save("official.search.command-bar", "search-history", next)
  }

  async function clearSearchHistory() {
    setSearchHistory([])
    await pluginDataRepo.save("official.search.command-bar", "search-history", [])
  }

  async function exportWorkspace(): Promise<string> {
    const workspace = workspaceState()
    if (!workspace) throw new Error("Workspace not loaded")
    const instances = await instanceRepo.getAll()
    const dataRows = await database.pluginData.toArray()
    const { createWorkspaceExport, serializeExport } = await import("./workspacePortability")
    const exportData = createWorkspaceExport(workspace, instances, dataRows)
    return serializeExport(exportData)
  }

  async function importWorkspace(json: string): Promise<{ warnings: string[] }> {
    const { parseExport, prepareImport } = await import("./workspacePortability")
    const data = parseExport(json)
    if (!data) throw new Error("导入数据格式无效")

    const availablePluginIds = officialPlugins.map((p) => p.manifest.id)
    const result = prepareImport(data, availablePluginIds)

    const existing = await workspaceRepo.get(result.workspace.id)
    if (existing) {
      result.workspace.id = `${result.workspace.id}-import-${Date.now()}`
      result.workspace.name = `${result.workspace.name} (导入)`
    }

    await workspaceRepo.save(result.workspace)
    for (const inst of result.instances) {
      await instanceRepo.save(inst)
    }
    for (const row of result.pluginDataRows) {
      await database.pluginData.put(row)
    }

    setWorkspaceState({ ...result.workspace })
    const gridInstances = result.instances.filter((i) => i.regionId === "mainGrid")
    setInstances(gridInstances)
    setActiveLayoutId(result.workspace.activeLayoutId)
    setThemeId(result.workspace.activeThemeId)

    return { warnings: result.warnings }
  }

  async function createWorkspace(name: string): Promise<Workspace> {
    const seed = createDefaultWorkspaceSeed({
      ...OFFICIAL_DEFAULT_WORKSPACE_SEED,
      workspaceName: name,
    })
    const ws = seed.workspace
    ws.id = `ws-${Date.now()}`
    ws.name = name
    await workspaceRepo.save(ws)
    for (const inst of seed.instances.filter((i) => i.regionId === "mainGrid")) {
      await instanceRepo.save(inst)
    }
    setWorkspaceList((prev) => [...prev, ws])
    return ws
  }

  async function switchWorkspace(id: string) {
    if (id === workspaceState()?.id) return
    const ws = await workspaceRepo.get(id)
    if (!ws) return
    setWorkspaceState(ws)
    setActiveLayoutId(ws.activeLayoutId)
    setThemeId(ws.activeThemeId)
    const allThemes = themes()
    applyThemeTokens(document.documentElement, resolveThemeTokens(ws.activeThemeId, allThemes))
    const allBg = backgrounds()
    const bg = ws.activeBackgroundProviderId ?? FALLBACK_BACKGROUND_ID
    setBackgroundId(bg)
    applyBackgroundStyle(resolveBackgroundStyle(bg, allBg))
    setSearchSettings(readSearchSettings(ws, searchProviders()))
    const loaded = await instanceRepo.getByRegion("mainGrid")
    setInstances(loaded)
  }

  async function deleteWorkspace(id: string) {
    if (id === "default") return
    await workspaceRepo.remove(id)
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
      themes: themes(),
      backgrounds: backgrounds(),
      searchProviders: searchProviders(),
      searchSettings: searchSettings(),
      plugins: pluginSummaries(),
    }
  }

  async function switchTheme(newThemeId: string) {
    const workspace = await workspaceRepo.get("default")
    if (!workspace) return
    const tokens = resolveThemeTokens(newThemeId, themes())
    applyThemeTokens(document.documentElement, tokens)
    setThemeId(newThemeId)
    workspace.activeThemeId = newThemeId
    workspace.updatedAt = new Date().toISOString()
    await workspaceRepo.save(workspace)
    setWorkspaceState({ ...workspace })
  }

  async function switchBackground(bgId: string) {
    const workspace = await workspaceRepo.get("default")
    if (!workspace) return
    applyBackgroundStyle(resolveBackgroundStyle(bgId, backgrounds()))
    setBackgroundId(bgId)
    workspace.activeBackgroundProviderId = bgId
    workspace.updatedAt = new Date().toISOString()
    await workspaceRepo.save(workspace)
    setWorkspaceState({ ...workspace })
  }

  const SearchView = () =>
    kernel.registry.views.get("official.search.command-bar.view") as SolidView

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

  function findWidgetPluginId(contributionId: string): string | null {
    for (const plugin of officialPlugins) {
      if (plugin.manifest.contributes.widgets?.some((w) => w.id === contributionId)) {
        return plugin.manifest.id
      }
    }
    return null
  }

  async function addWidget(contributionId: string) {
    const pluginId = findWidgetPluginId(contributionId)
    if (!pluginId) return
    const widget = findWidgetContribution(pluginId, contributionId)
    if (!widget) return
    const id = `${contributionId}-${Date.now()}`
    const inst: PluginInstance = {
      id,
      pluginId,
      contributionId,
      extensionPoint: "widget",
      regionId: "mainGrid",
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

  async function persistGridOrder(orderedInstances: PluginInstance[]) {
    const next = assignGridOrder(orderedInstances)

    for (const instance of next) {
      await instanceRepo.save(instance)
    }

    setInstances(next)
  }

  function onDrop(e: DragEvent, targetId: string) {
    e.preventDefault()
    const sourceId = dragId()
    if (!sourceId || sourceId === targetId) return
    setDragId(null)
    const list = [...instances()]
    const fromIdx = list.findIndex((i) => i.id === sourceId)
    const toIdx = list.findIndex((i) => i.id === targetId)
    if (fromIdx === -1 || toIdx === -1) return
    const [moved] = list.splice(fromIdx, 1)
    list.splice(toIdx, 0, moved!)
    void persistGridOrder(list)
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

  function renderMainGrid() {
    return (
      <>
        <section class="workbench-grid">
          <For each={instances()}>
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
                  onDrop={(e) => onDrop(e, inst.id)}
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
                    <div class="widget-header">
                      <span class="drag-handle" aria-hidden="true">
                        ⠿
                      </span>
                      <h2>{widgetTitle(inst.contributionId)}</h2>
                      <div class="widget-actions">
                        {(() => {
                          const w = findWidgetContribution(inst.pluginId, inst.contributionId)
                          const hasModal = !!w?.views.modal
                          return hasModal ? (
                            <button
                              class="widget-expand-btn"
                              onClick={() =>
                                kernel.events.emit("ui.modal.open", {
                                  viewId: w!.views.modal,
                                  props: {
                                    instanceId: inst.id,
                                    pluginId: inst.pluginId,
                                    contributionId: inst.contributionId,
                                    config: inst.config,
                                    data: makeScopedData(inst.pluginId, inst.id),
                                  },
                                })
                              }
                            >
                              ⛶
                            </button>
                          ) : null
                        })()}
                        <select
                          class="size-select"
                          value={inst.size ?? "M"}
                          onChange={(e) =>
                            changeWidgetSize(inst.id, e.currentTarget.value as WidgetSize)
                          }
                        >
                          {(widget?.supportedSizes ?? ["S", "M", "L"]).map((s) => (
                            <option value={s}>{s}</option>
                          ))}
                        </select>
                        <button class="widget-remove-btn" onClick={() => removeWidget(inst.id)}>
                          ×
                        </button>
                      </div>
                    </div>
                    <div class="widget-body">
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
          <div class="add-widgets-bar">
            <span>添加卡片：</span>
            <For each={availableWidgets()}>
              {(w) => (
                <button class="add-widget-btn" onClick={() => addWidget(w.id)}>
                  + {w.title}
                </button>
              )}
            </For>
          </div>
        </section>
      </>
    )
  }

  function runRailAction(actionId: string) {
    const action = WORKBENCH_RAIL_ACTIONS.find((item) => item.id === actionId)
    if (!action) return

    if (action.targetId) {
      const target = document.getElementById(action.targetId)
      target?.scrollIntoView({ block: "nearest" })
      target?.focus({ preventScroll: true })
      return
    }

    if (action.settingsPanelId) {
      openSettings(action.settingsPanelId)
    }
  }

  function renderActiveLayout() {
    const layout = findLayoutContribution(officialPlugins, activeLayoutId())
    const LayoutView = layout?.view ? viewOrUndefined(layout.view) : undefined

    if (!LayoutView) {
      return <>{renderMainGrid()}</>
    }

    const isDashboard = activeLayoutId() === "official.layout.workbench-dashboard"
    const isStream = activeLayoutId() === "official.layout.workbench-stream"

    if (isDashboard) {
      const rail = (
        <nav class="workbench-rail" aria-label="工作台导航">
          <For each={WORKBENCH_RAIL_ACTIONS}>
            {(action) => (
              <button
                class="rail-action"
                classList={{ active: action.isActive }}
                type="button"
                aria-label={action.ariaLabel}
                aria-current={action.isActive ? "page" : undefined}
                onClick={() => runRailAction(action.id)}
              >
                {action.label}
              </button>
            )}
          </For>
        </nav>
      )
      const topbar = (
        <div class="topbar">
          {SearchView()({
            providers: enabledSearchProviders(),
            defaultProviderId: resolveDefaultProviderForSearch(),
            onDefaultProviderChange: setDefaultSearchProvider,
            searchHistory: searchHistory(),
            onSaveHistory: saveSearchHistory,
            onClearHistory: clearSearchHistory,
          })}
        </div>
      )
      return LayoutView({ rail, topbar, mainGrid: renderMainGrid() })
    }

    if (isStream) {
      const toolbar = (
        <div style={{ display: "flex", "align-items": "center", gap: "12px" }}>
          <span style={{ "font-size": "15px", "font-weight": 700 }}>
            Tabora <span style={{ color: "rgb(var(--color-accent))" }}>Stream</span>
          </span>
          <div style={{ flex: 1 }} />
          <button class="rail-action" onClick={() => setSettingsOpen(true)}>
            ⚙ 设置
          </button>
        </div>
      )
      return LayoutView({ toolbar, stream: renderMainGrid() })
    }

    return <>{renderMainGrid()}</>
  }

  const isDark = () => themeId() === "official.theme.dark"

  return (
    <div class="tabora-root">
      <Show when={kernelReady()} fallback={<div class="loading">Loading Tabora...</div>}>
        <div class="toolbar">
          <div class="toolbar-spacer" />
          <select
            class="bg-select"
            value={backgroundId()}
            onChange={(e) => switchBackground(e.currentTarget.value)}
            aria-label="切换背景"
          >
            {backgrounds().map((b) => (
              <option value={b.id}>{b.title}</option>
            ))}
          </select>
          <button
            class="theme-toggle"
            onClick={() => switchTheme(isDark() ? "official.theme.light" : "official.theme.dark")}
            aria-label="切换主题"
          >
            {isDark() ? "☀" : "☾"}
          </button>
          <button
            class="theme-toggle"
            onClick={() => {
              const next =
                activeLayoutId() === "official.layout.workbench-dashboard"
                  ? "official.layout.workbench-stream"
                  : "official.layout.workbench-dashboard"
              setActiveLayoutId(next)
              const ws = workspaceState()
              if (ws) {
                void workspaceRepo.save({ ...ws, activeLayoutId: next })
              }
            }}
            aria-label="切换布局"
          >
            ⇄
          </button>
        </div>
        {renderActiveLayout()}
        <SettingsHost
          open={settingsOpen()}
          panels={collectSettingsPanels(officialPlugins)}
          activePanelId={activeSettingsPanelId()}
          onPanelChange={setActiveSettingsPanelId}
          onClose={() => setSettingsOpen(false)}
          getView={(viewId) => viewOrUndefined<SettingsPanelViewProps>(viewId)}
          panelProps={buildSettingsPanelProps}
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
    </div>
  )
}
