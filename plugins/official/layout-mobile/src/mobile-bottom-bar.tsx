import * as stylex from "@stylexjs/stylex"
import { createSignal, For, onCleanup, onMount, Show } from "solid-js"
import type { LayoutHostAPI } from "@tabora/plugin-api/sdk"
import type { RailGroupSetter } from "@tabora/layout-dashboard/state"
import { IconButton } from "@tabora/ui/button"
import { Input } from "@tabora/ui/input"
import Circle from "lucide-solid/icons/circle"

import { HostActionIcon } from "./host-action-icon"
import { styles } from "./styles"

export function MobileBottomBar(props: {
  host: LayoutHostAPI
  setGroups: RailGroupSetter
  onGroupCreated: (groupId: string) => void
}) {
  const railActions = () => props.host.getGlobalActions("rail")
  const utilityActions = () =>
    railActions().filter((action) => ["theme", "settings"].includes(action.id))
  const [inlineOpen, setInlineOpen] = createSignal(false)
  const [inlineName, setInlineName] = createSignal("")
  let inlineInput: HTMLInputElement | undefined
  let groupCounter = 1

  function cancelGroupCreate() {
    setInlineOpen(false)
    setInlineName("")
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

  function commitGroupName() {
    const name = inlineName().trim()
    if (!name) {
      cancelGroupCreate()
      return
    }
    groupCounter += 1
    const id = `group-${groupCounter}`
    props.setGroups((items) => [
      ...items,
      { id, name, icon: "circle-dot", isDefault: false, widgets: [] },
    ])
    props.onGroupCreated(id)
    cancelGroupCreate()
    props.host.showToast(`已创建分组「${name}」`, { type: "success" })
  }

  onMount(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && inlineOpen()) {
        event.preventDefault()
        cancelGroupCreate()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    onCleanup(() => window.removeEventListener("keydown", onKeyDown))
  })

  return (
    <nav {...stylex.attrs(styles.bar)} data-workbench-mobile-bar aria-label="工作台导航">
      <div {...stylex.attrs(styles.barGroups)}>
        <Show when={inlineOpen()}>
          <IconButton
            size="md"
            xstyle={[styles.barButton, styles.placeholder]}
            aria-label="正在命名"
          >
            <Circle size={16} />
          </IconButton>
          <div {...stylex.attrs(styles.inlinePop)} data-mobile-inline-pop>
            <Input
              xstyle={styles.inlineInput}
              ref={(element) => {
                inlineInput = element
              }}
              value={inlineName()}
              onInput={setInlineName}
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
              maxLength={20}
              aria-label="分组名"
            />
            <span {...stylex.attrs(styles.inlineHint)}>
              <kbd {...stylex.attrs(styles.inlineKbd)}>Enter</kbd>建
            </span>
          </div>
        </Show>
      </div>
      <IconButton
        size="md"
        xstyle={styles.barButton}
        aria-label="新建分组"
        title="新建分组"
        onClick={startCreateGroup}
      >
        <HostActionIcon id="add-widget" icon="plus" size={16} />
      </IconButton>
      <div {...stylex.attrs(styles.barDivider)} />
      <For each={utilityActions()}>
        {(action) => (
          <IconButton
            size="md"
            xstyle={[styles.barButton, action.isActive && styles.barButtonActive]}
            aria-label={action.label}
            title={action.label}
            onClick={() => action.run()}
          >
            <HostActionIcon id={action.id} icon={action.icon} />
          </IconButton>
        )}
      </For>
    </nav>
  )
}
