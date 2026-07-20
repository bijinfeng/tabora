import * as stylex from "@stylexjs/stylex"
import { TaboraMark } from "@tabora/brand"
import { createSignal, For, onCleanup, onMount, Show } from "solid-js"
import type { LayoutHostAPI } from "@tabora/plugin-api"
import { DropdownMenu } from "@tabora/ui"
import { HostActionIcon } from "./host-action-icon"
import { className, styles } from "./styles"
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
    <aside {...stylex.attrs(styles.rail)} data-workbench-rail aria-label="工作台导航">
      <TaboraMark class={className(styles.railLogo)} />
      <div {...stylex.attrs(styles.railGroups)}>
        <For each={groups()}>
          {(group, index) => {
            const shortcut = () => (index() < 9 ? `⌘${index() + 1}` : "")
            return (
              <div
                {...stylex.attrs(styles.railGroup)}
                onContextMenu={(event) => openGroupMenu(event, group.id)}
              >
                <button
                  {...stylex.attrs(
                    styles.railButton,
                    group.id === activeGroupId() && styles.railButtonActive,
                  )}
                  aria-label={`分组 ${group.name}`}
                  title={`${group.name} · 右键菜单${shortcut() ? ` · ${shortcut()}` : ""}`}
                  type="button"
                  onClick={() => switchGroup(group.id)}
                >
                  <span {...stylex.attrs(styles.groupIcon)}>{group.icon}</span>
                  <Show when={shortcut()}>
                    {(label) => <span {...stylex.attrs(styles.groupShortcut)}>{label()}</span>}
                  </Show>
                </button>
                <span {...stylex.attrs(styles.groupTip)}>{group.name} · Dashboard</span>
              </div>
            )
          }}
        </For>
        <Show when={inlineOpen()}>
          <div {...stylex.attrs(styles.placeholderWrap)}>
            <button
              {...stylex.attrs(styles.railButton, styles.placeholder)}
              type="button"
              aria-label="正在命名"
            >
              ●
            </button>
            <div {...stylex.attrs(styles.inlinePop)} data-rail-inline-pop>
              <input
                {...stylex.attrs(styles.inlineInput)}
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
              <span {...stylex.attrs(styles.inlineHint)}>
                <kbd {...stylex.attrs(styles.inlineKbd)}>Enter</kbd>建{" "}
                <kbd {...stylex.attrs(styles.inlineKbd)}>Esc</kbd>退
              </span>
            </div>
          </div>
        </Show>
      </div>
      <div {...stylex.attrs(styles.divider)} />
      <button
        {...stylex.attrs(styles.railButton)}
        aria-label="新建分组"
        title="新建分组（⌘ ⇧ N）"
        type="button"
        onClick={startCreateGroup}
      >
        <HostActionIcon id="add-widget" icon="+" size={16} />
      </button>
      <div {...stylex.attrs(styles.spacer)} />
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
                  <span {...stylex.attrs(styles.layoutLabel)}>
                    <span {...stylex.attrs(styles.layoutName)}>Dashboard</span>
                    <span {...stylex.attrs(styles.layoutDescription)}>控制面板：多卡片并列</span>
                  </span>
                ),
                icon: <LayoutDashboardIcon />,
                checked: isDashboardLayout(),
                onClick: () => selectLayout("dashboard"),
              },
              {
                id: "focus",
                label: (
                  <span {...stylex.attrs(styles.layoutLabel)}>
                    <span {...stylex.attrs(styles.layoutName)}>Focus</span>
                    <span {...stylex.attrs(styles.layoutDescription)}>深度专注：主卡 + 卫星</span>
                  </span>
                ),
                icon: <LayoutFocusIcon />,
                checked: !isDashboardLayout(),
                onClick: () => selectLayout("focus"),
              },
            ]}
            triggerClass={className(styles.railButton, layoutPopOpen() && styles.railButtonActive)}
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
            {...stylex.attrs(styles.railButton, action.isActive && styles.railButtonActive)}
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
            {...stylex.attrs(styles.groupMenu)}
            data-group-menu
            ref={(element) => {
              groupMenuPanel = element
            }}
            style={{ left: `${Math.max(8, menu().x)}px`, top: `${Math.max(8, menu().y)}px` }}
            role="menu"
            aria-label={`分组 ${menu().group.name} 菜单`}
          >
            <button
              {...stylex.attrs(styles.menuItem)}
              data-group-menu-item
              type="button"
              onClick={() => renameGroup(menu().group.id)}
            >
              <span>重命名</span>
              <kbd {...stylex.attrs(styles.menuKbd)}>F2</kbd>
            </button>
            <div {...stylex.attrs(styles.menuSeparator)} />
            <div {...stylex.attrs(styles.menuLabel)}>图标</div>
            <div {...stylex.attrs(styles.menuIcons)}>
              <For each={groupIcons}>
                {(icon) => (
                  <button
                    {...stylex.attrs(
                      styles.menuIcon,
                      icon === menu().group.icon && styles.menuIconActive,
                    )}
                    data-group-menu-icon
                    type="button"
                    onClick={() => setGroupIcon(menu().group.id, icon)}
                  >
                    {icon}
                  </button>
                )}
              </For>
            </div>
            <div {...stylex.attrs(styles.menuSeparator)} />
            <button
              {...stylex.attrs(styles.menuItem, styles.menuItemDanger)}
              data-group-menu-item
              data-danger
              type="button"
              disabled={menu().group.isDefault}
              onClick={() => deleteGroup(menu().group.id)}
            >
              <span>删除分组</span>
              <Show when={menu().group.isDefault}>
                <kbd {...stylex.attrs(styles.menuKbd)}>默认</kbd>
              </Show>
            </button>
          </div>
        )}
      </Show>
    </aside>
  )
}
