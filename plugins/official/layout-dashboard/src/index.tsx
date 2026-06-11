import { TaboraMark } from "@tabora/brand"
import { createMemo, createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import type { LayoutHostAPI, LayoutViewProps, PluginInstance } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { HostActionIcon } from "./host-action-icon"

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? "早上好" : h < 18 ? "下午好" : "晚上好"
}

function dateLabel() {
  const now = new Date()
  const date = new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
  }).format(now)
  const weekday = new Intl.DateTimeFormat("zh-CN", { weekday: "long" }).format(now)
  return `${date} ${weekday}`
}

function WorkbenchRail(props: { host: LayoutHostAPI }) {
  const railActions = () => props.host.getGlobalActions("rail")
  const primaryActions = () =>
    railActions().filter((action) => ["home", "add-widget"].includes(action.id))
  const utilityActions = () =>
    railActions().filter((action) => ["layout-switch", "theme", "settings"].includes(action.id))

  return (
    <aside class="dash-rail workbench-rail" aria-label="工作台导航">
      <TaboraMark class="dash-rail-logo" />
      <For each={primaryActions()}>
        {(action) => (
          <button
            class="dash-rail-btn"
            classList={{ active: action.isActive, "dash-rail-add": action.id === "add-widget" }}
            aria-label={action.label}
            title={action.label}
            type="button"
            onClick={() => action.run()}
          >
            <HostActionIcon id={action.id} icon={action.icon} />
          </button>
        )}
      </For>
      <div class="dash-rail-spacer" />
      <For each={utilityActions()}>
        {(action) => (
          <button
            class="dash-rail-btn"
            classList={{ active: action.isActive }}
            aria-label={action.label}
            title={action.label}
            type="button"
            onClick={() => action.run()}
          >
            <HostActionIcon id={action.id} icon={action.icon} />
          </button>
        )}
      </For>
    </aside>
  )
}

function widgetTitle(instance: PluginInstance) {
  const titles: Record<string, string> = {
    "today-focus": "今日重点",
    "quick-links": "快捷入口",
    todo: "待办",
    notes: "便签",
    weather: "天气",
    "plugin-status": "插件状态",
  }
  return titles[instance.contributionId] ?? instance.contributionId
}

export function DashboardLayout(props: LayoutViewProps<JSX.Element>) {
  const addWidgetAction = () =>
    props.host.getGlobalActions("rail").find((action) => action.id === "add-widget")

  return (
    <main class="layout-dashboard" data-layout="dashboard">
      <WorkbenchRail host={props.host} />
      <section class="dash-content">
        <header class="dash-topbar">
          <div class="dash-greeting">
            <div class="dash-greeting-title">
              {greeting()} <span class="dash-greeting-muted">· {dateLabel()}</span>
            </div>
            <div class="dash-greeting-actions">
              <Show when={addWidgetAction()}>
                {(action) => (
                  <button
                    class="tb-btn dash-toolbar-btn dash-add-widget-btn"
                    type="button"
                    onClick={() => action().run()}
                  >
                    <span>+ 添加卡片</span>
                  </button>
                )}
              </Show>
            </div>
          </div>
          <div class="dash-search-stage">
            <Show when={props.regions["topbar"]}>{props.regions["topbar"]!.render()}</Show>
          </div>
        </header>
        <section class="dash-grid">
          <div class="workbench-grid">
            <Show when={props.regions["mainGrid"]}>{props.regions["mainGrid"]!.render()}</Show>
          </div>
        </section>
      </section>
    </main>
  )
}

export function FocusLayout(props: LayoutViewProps<JSX.Element>) {
  const [selectedHeroId, setSelectedHeroId] = createSignal<string | null>(null)
  const toolbarActions = () => props.host.getGlobalActions("toolbar")
  const commandAction = () => toolbarActions().find((action) => action.id === "command")
  const layoutSwitchAction = () => toolbarActions().find((action) => action.id === "layout-switch")
  const instances = () => props.regions["focus"]?.instances ?? []
  const heroInstance = createMemo(() => {
    const selected = selectedHeroId()
    return instances().find((instance) => instance.id === selected) ?? instances()[0] ?? null
  })
  const satelliteInstances = createMemo(() => {
    const hero = heroInstance()
    return instances().filter((instance) => instance.id !== hero?.id)
  })

  return (
    <main class="layout-focus" data-layout="focus">
      <WorkbenchRail host={props.host} />
      <section class="focus-shell">
        <div class="focus-content">
          <header class="focus-topbar">
            <div class="focus-greeting">
              <span>{greeting()}</span>
              <span class="focus-muted">· {dateLabel()}</span>
            </div>
            <div class="focus-topbar-actions">
              <Show when={layoutSwitchAction()}>
                {(action) => (
                  <button
                    class="focus-icon-btn"
                    type="button"
                    aria-label={action().label}
                    title={action().label}
                    onClick={() => action().run()}
                  >
                    <HostActionIcon id={action().id} icon={action().icon} size={15} />
                  </button>
                )}
              </Show>
              <button
                class="focus-command"
                type="button"
                onClick={() => commandAction()?.run() ?? props.host.openCommandPalette()}
              >
                <span>搜索或命令</span>
                <kbd>⌘K</kbd>
              </button>
            </div>
          </header>

          <section class="focus-hero" aria-label="专注卡片">
            <Show
              when={heroInstance()}
              fallback={
                <button
                  class="focus-empty"
                  type="button"
                  onClick={() => props.host.openAddWidget()}
                >
                  添加第一张卡片
                </button>
              }
            >
              {(instance) => (
                <div class="focus-hero-render">
                  {props.regions["focus"]!.renderInstance(instance())}
                </div>
              )}
            </Show>
          </section>

          <Show when={satelliteInstances().length > 0}>
            <section class="focus-satellites" aria-label="可切换卡片">
              <For each={satelliteInstances()}>
                {(instance) => (
                  <button
                    class="focus-satellite"
                    type="button"
                    onClick={() => setSelectedHeroId(instance.id)}
                  >
                    <span class="focus-satellite-title">{widgetTitle(instance)}</span>
                    <span class="focus-satellite-meta">切换到主卡片</span>
                  </button>
                )}
              </For>
            </section>
          </Show>
        </div>
      </section>
    </main>
  )
}

export const layoutDashboard: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.layout.workbench-dashboard",
    name: "Workbench Dashboard Layout",
    version: "1.0.0",
    apiVersion: "1.0.0",
    entry: "./index",
    styles: [{ href: "./styles.css", scope: "global", order: 20 }],
    engine: { platform: "^0.1.0" },
    contributes: {
      layouts: [
        {
          id: "official.layout.workbench-dashboard",
          title: "工作台仪表盘布局",
          view: "official.layout.workbench-dashboard.view",
          regions: [
            {
              id: "topbar",
              title: "顶部搜索区",
              accepts: ["search"],
              required: false,
              maxInstances: 1,
            },
            { id: "mainGrid", title: "主网格", accepts: ["widget"], required: true },
          ],
          defaultRegions: {
            topbar: [{ instanceId: "search-main" }],
            mainGrid: [
              { instanceId: "today-focus-1" },
              { instanceId: "quick-links-1" },
              { instanceId: "todo-1" },
              { instanceId: "notes-1" },
              { instanceId: "weather-1" },
              { instanceId: "today-focus-2" },
              { instanceId: "quick-links-2" },
              { instanceId: "todo-2" },
            ],
          },
          supportsResponsive: true,
        },
        {
          id: "official.layout.workbench-focus",
          title: "工作台专注布局",
          view: "official.layout.workbench-focus.view",
          regions: [{ id: "focus", title: "专注卡片", accepts: ["widget"], required: true }],
          defaultRegions: {
            focus: [
              { instanceId: "today-focus-1" },
              { instanceId: "quick-links-1" },
              { instanceId: "todo-1" },
              { instanceId: "notes-1" },
              { instanceId: "weather-1" },
              { instanceId: "plugin-status-1" },
            ],
          },
          supportsResponsive: true,
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.layout.workbench-dashboard.view", DashboardLayout)
    context.registry.views.register("official.layout.workbench-focus.view", FocusLayout)
  },
}
