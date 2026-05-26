import { createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import type { PluginInstance, ThemeTokenSet, WidgetSize, Workspace } from "@tabora/plugin-api"
import { officialPlugins } from "@tabora/official-plugins"
import { createPluginKernel } from "@tabora/platform-kernel"
import { applyThemeTokens } from "@tabora/theme"
import {
  createInstanceRepository,
  createTaboraDatabase,
  createWorkspaceRepository,
} from "@tabora/storage"

type SolidView = (...args: any[]) => JSX.Element

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
    activeLayoutId: "official.layout.top-search-grid",
    activeThemeId: "official.theme.light",
    regions: {
      topbar: {
        regionId: "topbar",
        accepts: ["search"],
        instances: [{ instanceId: "search-main" }],
      },
      mainGrid: {
        regionId: "mainGrid",
        accepts: ["widget"],
        instances: [{ instanceId: "quick-links-1" }, { instanceId: "notes-1" }],
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
  ]
}

function findWidgetContribution(pluginId: string, contributionId: string) {
  const plugin = officialPlugins.find((p) => p.manifest.id === pluginId)
  return plugin?.manifest.contributes.widgets?.find((w) => w.id === contributionId)
}

const SIZE_SPAN: Record<WidgetSize, number> = { S: 1, M: 2, L: 2, XL: 4 }

export function App() {
  const [kernelReady, setKernelReady] = createSignal(false)
  const [instances, setInstances] = createSignal<PluginInstance[]>([])
  const [themeId, setThemeId] = createSignal("official.theme.light")
  const [backgroundId, setBackgroundId] = createSignal(DEFAULT_BACKGROUND_ID)
  const kernel = createPluginKernel()

  const database = createTaboraDatabase()
  const workspaceRepo = createWorkspaceRepository(database)
  const instanceRepo = createInstanceRepository(database)

  void kernel.discover(officialPlugins).then(async () => {
    await kernel.activateEnabledPlugins()

    let workspace = await workspaceRepo.get("default")
    if (!workspace) {
      workspace = defaultWorkspace()
      await workspaceRepo.save(workspace)
    }

    setThemeId(workspace.activeThemeId)
    applyThemeTokens(document.documentElement, tokensForTheme(workspace.activeThemeId))

    const savedBg = workspace.activeBackgroundProviderId ?? DEFAULT_BACKGROUND_ID
    setBackgroundId(savedBg)
    applyBackground(savedBg)

    let loaded = await instanceRepo.getByRegion("mainGrid")
    if (loaded.length === 0) {
      loaded = defaultInstances().filter((i) => i.regionId === "mainGrid")
      for (const inst of loaded) {
        await instanceRepo.save(inst)
      }
    }
    setInstances(loaded)
    setKernelReady(true)
  })

  async function switchTheme(newThemeId: string) {
    const workspace = await workspaceRepo.get("default")
    if (!workspace) return
    applyThemeTokens(document.documentElement, tokensForTheme(newThemeId))
    setThemeId(newThemeId)
    workspace.activeThemeId = newThemeId
    workspace.updatedAt = new Date().toISOString()
    await workspaceRepo.save(workspace)
  }

  async function switchBackground(bgId: string) {
    const workspace = await workspaceRepo.get("default")
    if (!workspace) return
    applyBackground(bgId)
    setBackgroundId(bgId)
    workspace.activeBackgroundProviderId = bgId
    workspace.updatedAt = new Date().toISOString()
    await workspaceRepo.save(workspace)
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

  function gridColumnSpan(size?: WidgetSize): number {
    return SIZE_SPAN[size ?? "M"] ?? 2
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
    await instanceRepo.save(inst)
    setInstances((prev) => [...prev, inst])
  }

  async function removeWidget(instanceId: string) {
    await instanceRepo.remove(instanceId)
    setInstances((prev) => prev.filter((i) => i.id !== instanceId))
  }

  async function changeWidgetSize(instanceId: string, newSize: WidgetSize) {
    const inst = instances().find((i) => i.id === instanceId)
    if (!inst) return
    const updated: PluginInstance = { ...inst, size: newSize, updatedAt: new Date().toISOString() }
    await instanceRepo.save(updated)
    setInstances((prev) => prev.map((i) => (i.id === instanceId ? updated : i)))
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
        <header class="topbar">{SearchView()({})}</header>
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
                  style={{ "grid-column": `span ${span}` }}
                  aria-label={widgetTitle(inst.contributionId)}
                >
                  <div class="widget-card">
                    <div class="widget-header">
                      <h2>{widgetTitle(inst.contributionId)}</h2>
                      <div class="widget-actions">
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
                    <div class="widget-body">{View({})}</div>
                  </div>
                </div>
              )
            }}
          </For>
        </section>
        <section class="add-widgets">
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
      </Show>
    </div>
  )
}
