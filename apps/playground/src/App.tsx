import { createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import type {
  BackgroundProviderContribution,
  PluginInstance,
  SearchProviderContribution,
  SettingsPanelViewProps,
  ThemeContribution,
  ThemeTokenSet,
  WidgetSize,
  WorkbenchSearchSettings,
  Workspace,
} from "@tabora/plugin-api"
import { officialPlugins } from "@tabora/official-plugins"
import { createPluginKernel } from "@tabora/platform-kernel"
import { applyThemeTokens } from "@tabora/theme"
import {
  createInstanceRepository,
  createTaboraDatabase,
  createWorkspaceRepository,
} from "@tabora/storage"
import { PluginViewBoundary } from "./PluginViewBoundary"
import { assignGridOrder, gridColumnSpan } from "./workbenchGrid"
import { WORKBENCH_RAIL_ACTIONS, findLayoutContribution } from "./workbenchShell"
import { SettingsHost, collectSettingsPanels, resolveInitialSettingsPanelId } from "./settingsHost"

type SolidView<Props = Record<string, unknown>> = (props: Props) => JSX.Element

const LIGHT_TOKENS: ThemeTokenSet = {
  "color-page": "237 241 238",
  "color-surface": "255 255 255",
  "color-text": "31 35 32",
  "color-muted": "102 112 105",
  "color-accent": "35 113 89",
  "color-line": "210 218 213",
  "radius-card": "16px",
}

const DARK_TOKENS: ThemeTokenSet = {
  "color-page": "18 18 18",
  "color-surface": "30 30 30",
  "color-text": "230 230 230",
  "color-muted": "140 140 140",
  "color-accent": "80 200 160",
  "color-line": "50 50 50",
  "radius-card": "16px",
}

function tokensForTheme(themeId: string): ThemeTokenSet {
  return themeId === "official.theme.dark" ? DARK_TOKENS : LIGHT_TOKENS
}

type BackgroundDef = { id: string; title: string; style: Record<string, string> }

const BACKGROUNDS: BackgroundDef[] = [
  {
    id: "background.gradient-green",
    title: "渐变绿",
    style: {
      background:
        "linear-gradient(135deg, rgba(35, 113, 89, 0.18), transparent 32%), rgb(var(--color-page))",
    },
  },
  {
    id: "background.solid-page",
    title: "纯色背景",
    style: { background: "rgb(var(--color-page))" },
  },
  {
    id: "background.gradient-blue",
    title: "渐变蓝",
    style: {
      background:
        "linear-gradient(160deg, rgba(66, 133, 244, 0.15), transparent 40%), rgb(var(--color-page))",
    },
  },
  {
    id: "background.gradient-purple",
    title: "渐变紫",
    style: {
      background:
        "linear-gradient(135deg, rgba(128, 90, 213, 0.15), transparent 35%), rgb(var(--color-page))",
    },
  },
]

const DEFAULT_BACKGROUND_ID = "background.gradient-green"

function applyBackground(bgId: string) {
  const bg = BACKGROUNDS.find((b) => b.id === bgId) ?? BACKGROUNDS[0]
  if (!bg) return
  for (const [prop, value] of Object.entries(bg.style)) {
    ;(document.body.style as any)[prop] = value
  }
}

function defaultWorkspace(): Workspace {
  return {
    id: "default",
    name: "默认工作区",
    activeLayoutId: "official.layout.workbench-dashboard",
    activeThemeId: "official.theme.light",
    regions: {
      rail: {
        regionId: "rail",
        accepts: ["layout"],
        instances: [],
      },
      topbar: {
        regionId: "topbar",
        accepts: ["search"],
        instances: [{ instanceId: "search-main" }],
      },
      mainGrid: {
        regionId: "mainGrid",
        accepts: ["widget"],
        instances: [
          { instanceId: "today-focus-1" },
          { instanceId: "quick-links-1" },
          { instanceId: "notes-1" },
          { instanceId: "todo-1" },
        ],
      },
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

function defaultInstances(): PluginInstance[] {
  const now = new Date().toISOString()
  return [
    {
      id: "search-main",
      pluginId: "official.search.command-bar",
      contributionId: "official.search.command-bar",
      extensionPoint: "search",
      regionId: "topbar",
      enabled: true,
      config: {},
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "today-focus-1",
      pluginId: "official.widgets.productivity",
      contributionId: "today-focus",
      extensionPoint: "widget",
      regionId: "mainGrid",
      enabled: true,
      size: "M",
      config: {},
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "quick-links-1",
      pluginId: "official.widgets.productivity",
      contributionId: "quick-links",
      extensionPoint: "widget",
      regionId: "mainGrid",
      enabled: true,
      size: "M",
      config: {},
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "notes-1",
      pluginId: "official.widgets.productivity",
      contributionId: "notes",
      extensionPoint: "widget",
      regionId: "mainGrid",
      enabled: true,
      size: "M",
      config: {},
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "todo-1",
      pluginId: "official.widgets.productivity",
      contributionId: "todo",
      extensionPoint: "widget",
      regionId: "mainGrid",
      enabled: true,
      size: "M",
      config: {},
      createdAt: now,
      updatedAt: now,
    },
  ]
}

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
  const [backgroundId, setBackgroundId] = createSignal(DEFAULT_BACKGROUND_ID)
  const [workspaceState, setWorkspaceState] = createSignal<Workspace | null>(null)
  const [settingsOpen, setSettingsOpen] = createSignal(false)
  const [activeSettingsPanelId, setActiveSettingsPanelId] = createSignal<string | null>(null)
  const [searchSettings, setSearchSettings] = createSignal<WorkbenchSearchSettings>({
    defaultProviderId: "official.search.google",
  })
  const [modalViewId, setModalViewId] = createSignal<string | null>(null)
  const [modalProps, setModalProps] = createSignal<Record<string, unknown>>({})
  const [fullscreenViewId, setFullscreenViewId] = createSignal<string | null>(null)
  const [fullscreenProps, setFullscreenProps] = createSignal<Record<string, unknown>>({})
  const [dragId, setDragId] = createSignal<string | null>(null)
  const kernel = createPluginKernel()

  const database = createTaboraDatabase()
  const workspaceRepo = createWorkspaceRepository(database)
  const instanceRepo = createInstanceRepository(database)

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
      workspace = defaultWorkspace()
      await workspaceRepo.save(workspace)
    }

    setWorkspaceState(workspace)
    setSearchSettings(readSearchSettings(workspace, searchProviders()))
    setActiveLayoutId(workspace.activeLayoutId)
    setThemeId(workspace.activeThemeId)
    applyThemeTokens(document.documentElement, tokensForTheme(workspace.activeThemeId))

    const savedBg = workspace.activeBackgroundProviderId ?? DEFAULT_BACKGROUND_ID
    setBackgroundId(savedBg)
    applyBackground(savedBg)

    let loaded = await instanceRepo.getByRegion("mainGrid")
    if (loaded.length === 0) {
      loaded = assignGridOrder(defaultInstances().filter((i) => i.regionId === "mainGrid"))
      for (const inst of loaded) {
        await instanceRepo.save(inst)
      }
    }
    setInstances(loaded)
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
    const saved = workspace.config?.search
    const defaultProviderId =
      typeof saved === "object" &&
      saved !== null &&
      "defaultProviderId" in saved &&
      typeof saved.defaultProviderId === "string"
        ? saved.defaultProviderId
        : (providers[0]?.id ?? "official.search.google")

    return { defaultProviderId }
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
      workspace.config = {
        ...(workspace.config ?? {}),
        search: { defaultProviderId: providerId },
      }
      return workspace
    })
    setSearchSettings({ defaultProviderId: providerId })
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
      },
      workspace,
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
    applyThemeTokens(document.documentElement, tokensForTheme(newThemeId))
    setThemeId(newThemeId)
    workspace.activeThemeId = newThemeId
    workspace.updatedAt = new Date().toISOString()
    await workspaceRepo.save(workspace)
    setWorkspaceState({ ...workspace })
  }

  async function switchBackground(bgId: string) {
    const workspace = await workspaceRepo.get("default")
    if (!workspace) return
    applyBackground(bgId)
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

  async function addWidget(contributionId: string) {
    const widget = findWidgetContribution("official.widgets.productivity", contributionId)
    if (!widget) return
    const id = `${contributionId}-${Date.now()}`
    const inst: PluginInstance = {
      id,
      pluginId: "official.widgets.productivity",
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
  }

  const availableWidgets = () => {
    const contributions: { id: string; title: string; defaultSize: WidgetSize }[] = []
    for (const plugin of officialPlugins) {
      for (const widget of plugin.manifest.contributes.widgets ?? []) {
        contributions.push({
          id: widget.id,
          title: widget.title,
          defaultSize: widget.defaultSize,
        })
      }
    }
    return contributions
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
                                  props: { instanceId: inst.id },
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
                        {View({ instanceId: inst.id })}
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
          providers: searchProviders(),
          defaultProviderId: searchSettings().defaultProviderId,
          onDefaultProviderChange: setDefaultSearchProvider,
        })}
      </div>
    )
    const mainGrid = renderMainGrid()

    return LayoutView ? (
      LayoutView({ rail, topbar, mainGrid })
    ) : (
      <>
        {topbar}
        {mainGrid}
      </>
    )
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
            {BACKGROUNDS.map((b) => (
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
      </Show>
    </div>
  )
}
