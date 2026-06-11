import { TaboraMark } from "@tabora/brand"
import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import type { JSX, Setter } from "solid-js"
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
  isDefault: boolean
  widgets: string[]
}

const groupIcons = ["T", "◐", "◇", "★", "◈", "⌘", "⚡", "◔", "♥", "■", "◆", "▲", "●", "✦"]

type RailGroupContextMenu = {
  groupId: string
  x: number
  y: number
}

function LayoutDashboardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

function LayoutFocusIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
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

function WorkbenchRail(props: {
  host: LayoutHostAPI
  groups?: () => RailGroup[]
  activeGroupId?: () => string
  setGroups?: Setter<RailGroup[]>
  setActiveGroupId?: Setter<string>
}) {
  const railActions = () => props.host.getGlobalActions("rail")
  const layoutAction = () => railActions().find((action) => action.id === "layout-switch")
  const utilityActions = () =>
    railActions().filter((action) => ["theme", "settings"].includes(action.id))
  const homeAction = () => railActions().find((action) => action.id === "home")
  const [inlineOpen, setInlineOpen] = createSignal(false)
  const [inlineName, setInlineName] = createSignal("")
  const [layoutPopOpen, setLayoutPopOpen] = createSignal(false)
  const [groupMenu, setGroupMenu] = createSignal<RailGroupContextMenu | null>(null)
  const fallbackDefaultGroup = (): RailGroup => ({
    id: "default",
    name: homeAction()?.label.replace(/^分组\s*/, "") || "我的工作台",
    icon: "T",
    isDefault: true,
    widgets: [],
  })
  const [fallbackGroups, setFallbackGroups] = createSignal<RailGroup[]>([fallbackDefaultGroup()])
  const [fallbackActiveGroupId, setFallbackActiveGroupId] = createSignal("default")
  const groups = props.groups ?? fallbackGroups
  const activeGroupId = props.activeGroupId ?? fallbackActiveGroupId
  const setGroups = props.setGroups ?? setFallbackGroups
  const setActiveGroupId = props.setActiveGroupId ?? setFallbackActiveGroupId
  let inlineInput: HTMLInputElement | undefined
  let layoutSwitchWrap: HTMLDivElement | undefined
  let groupMenuPanel: HTMLDivElement | undefined
  let groupCounter = 1

  const isDashboardLayout = () => layoutAction()?.icon === "layout-focus"

  function pickDefaultIcon(name: string) {
    const first = name.trim()[0] ?? ""
    return /[A-Za-z]/.test(first) ? first.toUpperCase() : "◐"
  }

  function startCreateGroup() {
    if (inlineOpen()) {
      inlineInput?.focus()
      return
    }
    setLayoutPopOpen(false)
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
    setGroups((items) => [
      ...items,
      { id, name, icon: pickDefaultIcon(name), isDefault: false, widgets: [] },
    ])
    setActiveGroupId(id)
    setGroupMenu(null)
    cancelGroupCreate()
    props.host.showToast(`已创建分组「${name}」 · 右键可改图标和布局`, { type: "success" })
  }

  function switchGroup(groupId: string) {
    if (inlineOpen()) return
    if (groupId === activeGroupId()) return
    const group = groups().find((item) => item.id === groupId)
    if (!group) return
    setLayoutPopOpen(false)
    setGroupMenu(null)
    setActiveGroupId(groupId)
    if (groupId === "default") homeAction()?.run()
    props.host.showToast(`已切换到「${group.name}」`, { type: "success" })
  }

  function activeGroupMenu() {
    const menu = groupMenu()
    if (!menu) return null
    const group = groups().find((item) => item.id === menu.groupId)
    return group ? { ...menu, group } : null
  }

  function openGroupMenu(event: MouseEvent, groupId: string) {
    event.preventDefault()
    setLayoutPopOpen(false)
    cancelGroupCreate()
    setGroupMenu({
      groupId,
      x: Math.min(event.clientX, window.innerWidth - 220),
      y: Math.min(event.clientY, window.innerHeight - 320),
    })
  }

  function renameGroup(groupId: string) {
    const group = groups().find((item) => item.id === groupId)
    if (!group) return
    const next = window.prompt("新名称", group.name)
    if (next == null) return
    const name = next.trim().slice(0, 20)
    if (!name) return
    setGroups((items) => items.map((item) => (item.id === groupId ? { ...item, name } : item)))
    setGroupMenu(null)
    props.host.showToast(`已重命名为「${name}」`, { type: "success" })
  }

  function setGroupIcon(groupId: string, icon: string) {
    const group = groups().find((item) => item.id === groupId)
    if (!group) return
    setGroups((items) => items.map((item) => (item.id === groupId ? { ...item, icon } : item)))
    props.host.showToast(`已更新「${group.name}」图标`, { type: "success" })
  }

  function deleteGroup(groupId: string) {
    const group = groups().find((item) => item.id === groupId)
    if (!group || group.isDefault) return
    setGroups((items) => items.filter((item) => item.id !== groupId))
    if (activeGroupId() === groupId) {
      setActiveGroupId("default")
      homeAction()?.run()
    }
    setGroupMenu(null)
    props.host.showToast(`已删除「${group.name}」`, { type: "success" })
  }

  function toggleLayoutPopover() {
    if (!layoutAction()) return
    cancelGroupCreate()
    setLayoutPopOpen((open) => !open)
  }

  function selectLayout(target: "dashboard" | "focus") {
    const dashboardActive = isDashboardLayout()
    if ((target === "dashboard" && dashboardActive) || (target === "focus" && !dashboardActive)) {
      setLayoutPopOpen(false)
      return
    }
    layoutAction()?.run()
    setLayoutPopOpen(false)
    props.host.showToast(
      target === "dashboard" ? "已切换到 Dashboard 布局" : "已切换到 Focus 布局",
      {
        type: "success",
      },
    )
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
      if (event.key === "Escape" && layoutPopOpen()) {
        event.preventDefault()
        setLayoutPopOpen(false)
      }
      if (event.key === "Escape" && groupMenu()) {
        event.preventDefault()
        setGroupMenu(null)
      }
    }
    const onPointerDown = (event: PointerEvent) => {
      const path = event.composedPath()
      if (layoutPopOpen() && !(layoutSwitchWrap && path.includes(layoutSwitchWrap))) {
        setLayoutPopOpen(false)
      }
      if (groupMenu() && !(groupMenuPanel && path.includes(groupMenuPanel))) {
        setGroupMenu(null)
      }
    }
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("pointerdown", onPointerDown)
    onCleanup(() => {
      window.removeEventListener("keydown", onKeyDown)
      window.removeEventListener("pointerdown", onPointerDown)
    })
  })

  return (
    <aside class="dash-rail workbench-rail" aria-label="工作台导航">
      <TaboraMark class="dash-rail-logo" />
      <div class="dash-rail-groups">
        <For each={groups()}>
          {(group, index) => {
            const shortcut = () => (index() < 9 ? `⌘${index() + 1}` : "")
            return (
              <div
                class="dash-rail-group"
                onContextMenu={(event) => openGroupMenu(event, group.id)}
              >
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
      <Show when={layoutAction()}>
        {(action) => (
          <div
            class="dash-layout-switch-wrap"
            ref={(element) => {
              layoutSwitchWrap = element
            }}
          >
            <button
              class="dash-rail-btn"
              classList={{ active: layoutPopOpen() }}
              aria-label="切换布局"
              aria-expanded={layoutPopOpen()}
              title="切换布局"
              type="button"
              onClick={toggleLayoutPopover}
            >
              <HostActionIcon id={action().id} icon={action().icon} />
            </button>
            <div class="dash-layout-switch-pop" classList={{ open: layoutPopOpen() }}>
              <div class="dash-layout-switch-header">布局</div>
              <button
                class="dash-layout-switch-item"
                classList={{ active: isDashboardLayout() }}
                type="button"
                onClick={() => selectLayout("dashboard")}
              >
                <span class="dash-layout-switch-icon">
                  <LayoutDashboardIcon />
                </span>
                <span class="dash-layout-switch-text">
                  <span class="dash-layout-switch-name">Dashboard</span>
                  <span class="dash-layout-switch-desc">控制面板：多卡片并列</span>
                </span>
                <Show when={isDashboardLayout()}>
                  <span class="dash-layout-switch-check">✓</span>
                </Show>
              </button>
              <button
                class="dash-layout-switch-item"
                classList={{ active: !isDashboardLayout() }}
                type="button"
                onClick={() => selectLayout("focus")}
              >
                <span class="dash-layout-switch-icon">
                  <LayoutFocusIcon />
                </span>
                <span class="dash-layout-switch-text">
                  <span class="dash-layout-switch-name">Focus</span>
                  <span class="dash-layout-switch-desc">深度专注：主卡 + 卫星</span>
                </span>
                <Show when={!isDashboardLayout()}>
                  <span class="dash-layout-switch-check">✓</span>
                </Show>
              </button>
            </div>
          </div>
        )}
      </Show>
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
      <Show when={activeGroupMenu()}>
        {(menu) => (
          <div
            class="dash-group-menu"
            ref={(element) => {
              groupMenuPanel = element
            }}
            style={{ left: `${Math.max(8, menu().x)}px`, top: `${Math.max(8, menu().y)}px` }}
            role="menu"
            aria-label={`分组 ${menu().group.name} 菜单`}
          >
            <button
              class="dash-group-menu-item"
              type="button"
              onClick={() => renameGroup(menu().group.id)}
            >
              <span>重命名</span>
              <kbd>F2</kbd>
            </button>
            <div class="dash-group-menu-sep" />
            <div class="dash-group-menu-label">图标</div>
            <div class="dash-group-menu-icons">
              <For each={groupIcons}>
                {(icon) => (
                  <button
                    class="dash-group-menu-icon"
                    classList={{ active: icon === menu().group.icon }}
                    type="button"
                    onClick={() => setGroupIcon(menu().group.id, icon)}
                  >
                    {icon}
                  </button>
                )}
              </For>
            </div>
            <div class="dash-group-menu-sep" />
            <button
              class="dash-group-menu-item danger"
              classList={{ disabled: menu().group.isDefault }}
              type="button"
              disabled={menu().group.isDefault}
              onClick={() => deleteGroup(menu().group.id)}
            >
              <span>删除分组</span>
              <Show when={menu().group.isDefault}>
                <kbd>默认</kbd>
              </Show>
            </button>
          </div>
        )}
      </Show>
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
  const homeAction = () =>
    props.host.getGlobalActions("rail").find((action) => action.id === "home")
  const defaultGroup = (): RailGroup => ({
    id: "default",
    name: homeAction()?.label.replace(/^分组\s*/, "") || "我的工作台",
    icon: "T",
    isDefault: true,
    widgets: [],
  })
  const [groups, setGroups] = createSignal<RailGroup[]>([defaultGroup()])
  const [activeGroupId, setActiveGroupId] = createSignal("default")
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
        setGroups={setGroups}
        setActiveGroupId={setActiveGroupId}
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

    context.registry.views.register("official.layout.workbench-dashboard.view", (props) =>
      DashboardLayout({ ...(props as any), i18n: context.i18n }),
    )
    context.registry.views.register("official.layout.workbench-focus.view", (props) =>
      FocusLayout({ ...(props as any), i18n: context.i18n }),
    )
  },
}
