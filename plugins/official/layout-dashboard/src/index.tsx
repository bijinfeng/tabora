import { createMemo, createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import type { LayoutViewProps, PluginInstance } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { HostActionIcon } from "./host-action-icon"
import { dateLabel, fallbackText, greeting } from "./i18n"
import { WorkbenchRail } from "./workbench-rail"
import type {
  ActiveGroupSetter,
  DashboardLayoutState,
  LayoutViewPropsWithI18n,
  RailGroup,
  RailGroupSetter,
} from "./types"

const dashboardLayoutStateKey = "official.layout.workbench-dashboard.groups"

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

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string")
}

function isStoredRailGroup(value: unknown): value is RailGroup {
  if (!value || typeof value !== "object") return false
  const candidate = value as Partial<RailGroup>
  return (
    typeof candidate.id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.icon === "string" &&
    typeof candidate.isDefault === "boolean" &&
    isStringArray(candidate.widgets)
  )
}

function normalizeDashboardLayoutState(
  value: unknown,
  fallbackDefaultGroup: RailGroup,
): DashboardLayoutState {
  const raw =
    value && typeof value === "object"
      ? (value as Partial<{ groups: unknown; activeGroupId: unknown }>)
      : {}
  const storedGroups = Array.isArray(raw.groups) ? raw.groups.filter(isStoredRailGroup) : []
  const storedDefault = storedGroups.find((group) => group.id === "default")
  const defaultGroup = {
    ...fallbackDefaultGroup,
    ...(storedDefault
      ? { name: storedDefault.name, icon: storedDefault.icon, widgets: storedDefault.widgets }
      : {}),
    id: "default",
    isDefault: true,
  }
  const customGroups = storedGroups.filter((group) => group.id !== "default" && !group.isDefault)
  const groups = [defaultGroup, ...customGroups]
  const activeGroupId =
    typeof raw.activeGroupId === "string" && groups.some((group) => group.id === raw.activeGroupId)
      ? raw.activeGroupId
      : "default"

  return { groups, activeGroupId }
}

function resolveSetterValue<T>(previous: T, value: T | ((previous: T) => T)): T {
  return typeof value === "function" ? (value as (previous: T) => T)(previous) : value
}

export function DashboardLayout(props: LayoutViewPropsWithI18n<JSX.Element>) {
  const i18n = () => props.i18n
  const t = (key: string) => i18n()?.t(key) ?? fallbackText(key)
  const locale = () => i18n()?.locale() ?? "zh-CN"
  const addWidgetAction = () =>
    props.host.getGlobalActions("menu").find((action) => action.id === "add-widget")
  const homeAction = () =>
    props.host.getGlobalActions("rail").find((action) => action.id === "home")
  const defaultGroup = (): RailGroup => ({
    id: "default",
    name: homeAction()?.label.replace(/^分组\s*/, "") || "我的工作台",
    icon: "T",
    isDefault: true,
    widgets: [],
  })
  const initialState = normalizeDashboardLayoutState(
    props.host.readLayoutState<DashboardLayoutState>(dashboardLayoutStateKey),
    defaultGroup(),
  )
  const [groups, setGroups] = createSignal<RailGroup[]>(initialState.groups)
  const [activeGroupId, setActiveGroupId] = createSignal(initialState.activeGroupId)
  const persistDashboardState = (nextGroups: RailGroup[], nextActiveGroupId: string) => {
    props.host.writeLayoutState(dashboardLayoutStateKey, {
      groups: nextGroups,
      activeGroupId: nextActiveGroupId,
    } satisfies DashboardLayoutState)
  }
  const setPersistedGroups: RailGroupSetter = (value) => {
    const next = resolveSetterValue(groups(), value)
    setGroups(next)
    persistDashboardState(next, activeGroupId())
    return next
  }
  const setPersistedActiveGroupId: ActiveGroupSetter = (value) => {
    const next = resolveSetterValue(activeGroupId(), value)
    setActiveGroupId(next)
    persistDashboardState(groups(), next)
    return next
  }
  const activeGroup = createMemo(
    () => groups().find((group) => group.id === activeGroupId()) ?? groups()[0] ?? defaultGroup(),
  )
  const activeMainGridInstances = createMemo(() => {
    const group = activeGroup()
    const region = props.regions["mainGrid"]
    if (!region || group.isDefault) return region?.instances ?? []

    const allowed = new Set(group.widgets)
    return region.instances.filter((instance) => allowed.has(instance.id))
  })

  return (
    <main class="layout-dashboard" data-layout="dashboard">
      <WorkbenchRail
        host={props.host}
        groups={groups}
        activeGroupId={activeGroupId}
        setGroups={setPersistedGroups}
        setActiveGroupId={setPersistedActiveGroupId}
      />
      <section class="dash-content">
        <header class="dash-topbar">
          <div class="dash-greeting">
            <div class="dash-greeting-title">
              {greeting(t)} <span class="dash-greeting-muted">· {dateLabel(locale())}</span>
            </div>
            <div class="dash-greeting-actions">
              <Show when={addWidgetAction()}>
                {(action) => (
                  <button
                    class="tb-btn dash-toolbar-btn dash-add-widget-btn"
                    type="button"
                    onClick={() => action().run()}
                  >
                    <span>{t("actions.addWidget")}</span>
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
            <Show when={props.regions["mainGrid"]}>
              {(region) => (
                <Show when={!activeGroup().isDefault} fallback={region().render()}>
                  <Show
                    when={activeMainGridInstances().length > 0}
                    fallback={
                      <button
                        class="dash-empty-group"
                        type="button"
                        onClick={() => props.host.openAddWidget()}
                      >
                        <span>暂无卡片</span>
                        <span aria-hidden="true"> · </span>
                        <span class="dash-empty-group-action">添加第一个</span>
                      </button>
                    }
                  >
                    <For each={activeMainGridInstances()}>
                      {(instance) => region().renderInstance(instance)}
                    </For>
                  </Show>
                </Show>
              )}
            </Show>
          </div>
        </section>
      </section>
    </main>
  )
}
export function FocusLayout(props: LayoutViewPropsWithI18n<JSX.Element>) {
  const i18n = () => props.i18n
  const t = (key: string) => i18n()?.t(key) ?? fallbackText(key)
  const locale = () => i18n()?.locale() ?? "zh-CN"
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
              <span>{greeting(t)}</span>
              <span class="focus-muted">· {dateLabel(locale())}</span>
            </div>
            <div class="focus-topbar-actions">
              <Show when={layoutSwitchAction()}>
                {(action) => (
                  <button
                    class="focus-icon-btn"
                    type="button"
                    aria-label={action().label}
                    title={action().label}
                    onClick={() => {
                      action().run()
                      props.host.showToast("已切换到 Dashboard 布局", { type: "success" })
                    }}
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
                <span>{t("search.placeholder")}</span>
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
                  {t("focus.empty")}
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
                    <span class="focus-satellite-meta">{t("focus.switchHero")}</span>
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
    context.i18n?.registerMessages([
      {
        locale: "zh-CN",
        messages: {
          "greeting.morning": "早上好",
          "greeting.afternoon": "下午好",
          "greeting.evening": "晚上好",
          "actions.addWidget": "+ 添加卡片",
          "search.placeholder": "搜索或命令",
          "focus.empty": "添加第一张卡片",
          "focus.switchHero": "切换到主卡片",
        },
      },
      {
        locale: "en-US",
        messages: {
          "greeting.morning": "Good morning",
          "greeting.afternoon": "Good afternoon",
          "greeting.evening": "Good evening",
          "actions.addWidget": "+ Add widget",
          "search.placeholder": "Search or command",
          "focus.empty": "Add your first widget",
          "focus.switchHero": "Switch to main",
        },
      },
    ])

    context.registry.views.register(
      "official.layout.workbench-dashboard.view",
      (props: LayoutViewProps<JSX.Element>) =>
        DashboardLayout({ ...props, ...(context.i18n ? { i18n: context.i18n } : {}) }),
    )
    context.registry.views.register(
      "official.layout.workbench-focus.view",
      (props: LayoutViewProps<JSX.Element>) =>
        FocusLayout({ ...props, ...(context.i18n ? { i18n: context.i18n } : {}) }),
    )
  },
}
