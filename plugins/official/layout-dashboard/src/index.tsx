import { TaboraMark } from "@tabora/brand"
import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import type { JSX } from "solid-js"
import type { LayoutHostAPI, LayoutViewProps, PluginInstance } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { HostActionIcon } from "./host-action-icon"

type LayoutI18n = {
  locale(): string
  t(key: string, vars?: Record<string, string | number>): string
  registerMessages(bundles: Array<{ locale: string; messages: Record<string, string> }>): void
}

type RailGroup = {
  id: string
  name: string
  icon: string
}

function greeting(t: (key: string) => string) {
  const h = new Date().getHours()
  return h < 12 ? t("greeting.morning") : h < 18 ? t("greeting.afternoon") : t("greeting.evening")
}

function dateLabel(locale: string) {
  const now = new Date()
  const date = new Intl.DateTimeFormat(locale, {
    month: "numeric",
    day: "numeric",
  }).format(now)
  const weekday = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(now)
  return `${date} ${weekday}`
}

function fallbackText(key: string): string {
  const messages: Record<string, string> = {
    "greeting.morning": "早上好",
    "greeting.afternoon": "下午好",
    "greeting.evening": "晚上好",
    "actions.addWidget": "+ 添加卡片",
    "search.placeholder": "搜索或命令",
    "focus.empty": "添加第一张卡片",
    "focus.switchHero": "切换到主卡片",
  }
  return messages[key] ?? key
}

function WorkbenchRail(props: { host: LayoutHostAPI }) {
  const railActions = () => props.host.getGlobalActions("rail")
  const utilityActions = () =>
    railActions().filter((action) => ["layout-switch", "theme", "settings"].includes(action.id))
  const homeAction = () => railActions().find((action) => action.id === "home")
  const defaultGroup = (): RailGroup => ({
    id: "default",
    name: homeAction()?.label.replace(/^分组\s*/, "") || "我的工作台",
    icon: "T",
  })
  const [groups, setGroups] = createSignal<RailGroup[]>([defaultGroup()])
  const [activeGroupId, setActiveGroupId] = createSignal("default")
  const [inlineOpen, setInlineOpen] = createSignal(false)
  const [inlineName, setInlineName] = createSignal("")
  let inlineInput: HTMLInputElement | undefined
  let groupCounter = 1

  function pickDefaultIcon(name: string) {
    const first = name.trim()[0] ?? ""
    return /[A-Za-z]/.test(first) ? first.toUpperCase() : "◐"
  }

  function startCreateGroup() {
    if (inlineOpen()) {
      inlineInput?.focus()
      return
    }
    setInlineOpen(true)
    setInlineName("")
    window.setTimeout(() => inlineInput?.focus(), 80)
  }

  function cancelGroupCreate() {
    setInlineOpen(false)
    setInlineName("")
  }

  function commitGroupName() {
    const name = inlineName().trim()
    if (!name) {
      cancelGroupCreate()
      return
    }
    groupCounter += 1
    const id = `group-${groupCounter}`
    setGroups((items) => [...items, { id, name, icon: pickDefaultIcon(name) }])
    setActiveGroupId(id)
    cancelGroupCreate()
  }

  function switchGroup(groupId: string) {
    if (inlineOpen()) return
    setActiveGroupId(groupId)
    if (groupId === "default") homeAction()?.run()
  }

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === "n") {
        event.preventDefault()
        startCreateGroup()
        return
      }
      if ((event.metaKey || event.ctrlKey) && !event.shiftKey && /^[1-9]$/.test(event.key)) {
        const target = groups()[Number.parseInt(event.key, 10) - 1]
        if (target) {
          event.preventDefault()
          switchGroup(target.id)
        }
        return
      }
      if (event.key === "Escape" && inlineOpen()) {
        event.preventDefault()
        cancelGroupCreate()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    onCleanup(() => window.removeEventListener("keydown", onKeyDown))
  })

  return (
    <aside class="dash-rail workbench-rail" aria-label="工作台导航">
      <TaboraMark class="dash-rail-logo" />
      <div class="dash-rail-groups">
        <For each={groups()}>
          {(group, index) => {
            const shortcut = () => (index() < 9 ? `⌘${index() + 1}` : "")
            return (
              <div class="dash-rail-group">
                <button
                  class="dash-rail-btn"
                  classList={{ active: group.id === activeGroupId() }}
                  aria-label={`分组 ${group.name}`}
                  title={`${group.name} · 右键菜单${shortcut() ? ` · ${shortcut()}` : ""}`}
                  type="button"
                  onClick={() => switchGroup(group.id)}
                >
                  <span class="dash-rail-group-icon">{group.icon}</span>
                  <Show when={shortcut()}>
                    {(label) => <span class="dash-rail-group-shortcut">{label()}</span>}
                  </Show>
                </button>
                <span class="dash-rail-group-tip">{group.name} · Dashboard</span>
              </div>
            )
          }}
        </For>
        <Show when={inlineOpen()}>
          <div class="dash-rail-placeholder-wrap">
            <button class="dash-rail-btn dash-rail-placeholder" type="button" aria-label="正在命名">
              ●
            </button>
            <div class="dash-inline-pop open">
              <input
                ref={(element) => {
                  inlineInput = element
                }}
                value={inlineName()}
                onInput={(event) => setInlineName(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault()
                    commitGroupName()
                  } else if (event.key === "Escape") {
                    event.preventDefault()
                    cancelGroupCreate()
                  }
                }}
                onBlur={() => {
                  window.setTimeout(() => {
                    if (inlineOpen()) cancelGroupCreate()
                  }, 150)
                }}
                placeholder="分组名 · Enter 创建"
                maxlength={20}
                aria-label="分组名"
              />
              <span class="dash-inline-hint">
                <kbd>Enter</kbd>建 <kbd>Esc</kbd>退
              </span>
            </div>
          </div>
        </Show>
      </div>
      <div class="dash-rail-divider" />
      <button
        class="dash-rail-btn dash-rail-add"
        aria-label="新建分组"
        title="新建分组（⌘ ⇧ N）"
        type="button"
        onClick={startCreateGroup}
      >
        <HostActionIcon id="add-widget" icon="+" size={16} />
      </button>
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
  const i18n = () => (props as LayoutViewProps<JSX.Element> & { i18n?: LayoutI18n }).i18n
  const t = (key: string) => i18n()?.t(key) ?? fallbackText(key)
  const locale = () => i18n()?.locale() ?? "zh-CN"
  const addWidgetAction = () =>
    props.host.getGlobalActions("menu").find((action) => action.id === "add-widget")

  return (
    <main class="layout-dashboard" data-layout="dashboard">
      <WorkbenchRail host={props.host} />
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
            <Show when={props.regions["mainGrid"]}>{props.regions["mainGrid"]!.render()}</Show>
          </div>
        </section>
      </section>
    </main>
  )
}

export function FocusLayout(props: LayoutViewProps<JSX.Element>) {
  const i18n = () => (props as LayoutViewProps<JSX.Element> & { i18n?: LayoutI18n }).i18n
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

    context.registry.views.register("official.layout.workbench-dashboard.view", (props) =>
      DashboardLayout({ ...(props as any), i18n: context.i18n }),
    )
    context.registry.views.register("official.layout.workbench-focus.view", (props) =>
      FocusLayout({ ...(props as any), i18n: context.i18n }),
    )
  },
}
