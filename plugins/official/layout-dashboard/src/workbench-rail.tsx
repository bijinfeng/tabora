import { TaboraMark } from "@tabora/brand"
import { createSignal, For, onCleanup, onMount, Show } from "solid-js"
import type { LayoutHostAPI } from "@tabora/plugin-api"
import { DropdownMenu } from "@tabora/ui"
import { HostActionIcon } from "./host-action-icon"
import type { ActiveGroupSetter, RailGroup, RailGroupContextMenu, RailGroupSetter } from "./types"

const groupIcons = ["T", "◐", "◇", "★", "◈", "⌘", "⚡", "◔", "♥", "■", "◆", "▲", "●", "✦"]

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

export function WorkbenchRail(props: {
  host: LayoutHostAPI
  groups?: () => RailGroup[]
  activeGroupId?: () => string
  setGroups?: RailGroupSetter
  setActiveGroupId?: ActiveGroupSetter
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
    icon: "◐",
    isDefault: true,
    widgets: [],
  })
  const [fallbackGroups, setFallbackGroups] = createSignal<RailGroup[]>([fallbackDefaultGroup()])
  const [fallbackActiveGroupId, setFallbackActiveGroupId] = createSignal("default")
  const groups = props.groups ?? fallbackGroups
  const activeGroupId = props.activeGroupId ?? fallbackActiveGroupId
  const setGroups = props.setGroups ?? ((value) => setFallbackGroups(value))
  const setActiveGroupId = props.setActiveGroupId ?? ((value) => setFallbackActiveGroupId(value))
  let inlineInput: HTMLInputElement | undefined
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
          <DropdownMenu
            open={layoutPopOpen()}
            onOpenChange={(open) => {
              if (open) cancelGroupCreate()
              setLayoutPopOpen(open)
            }}
            title="布局"
            side="right"
            align="start"
            sideOffset={14}
            alignOffset={-6}
            items={[
              {
                id: "dashboard",
                label: (
                  <span class="dash-layout-switch-text">
                    <span class="dash-layout-switch-name">Dashboard</span>
                    <span class="dash-layout-switch-desc">控制面板：多卡片并列</span>
                  </span>
                ),
                icon: <LayoutDashboardIcon />,
                checked: isDashboardLayout(),
                onClick: () => selectLayout("dashboard"),
              },
              {
                id: "focus",
                label: (
                  <span class="dash-layout-switch-text">
                    <span class="dash-layout-switch-name">Focus</span>
                    <span class="dash-layout-switch-desc">深度专注：主卡 + 卫星</span>
                  </span>
                ),
                icon: <LayoutFocusIcon />,
                checked: !isDashboardLayout(),
                onClick: () => selectLayout("focus"),
              },
            ]}
            triggerClass="dash-rail-btn"
            triggerClassList={{ active: layoutPopOpen() }}
            triggerAriaLabel="切换布局"
            triggerTitle="切换布局"
          >
            <HostActionIcon id={action().id} icon={action().icon} />
          </DropdownMenu>
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
