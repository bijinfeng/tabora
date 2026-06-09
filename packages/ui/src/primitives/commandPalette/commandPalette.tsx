import type { JSX } from "solid-js"
import { For, Show } from "solid-js"

export type CommandPaletteItem = {
  id: string
  label: JSX.Element
  description?: JSX.Element
  icon?: JSX.Element
  shortcut?: string
  disabled?: boolean
}

export type CommandPaletteGroup = {
  label: JSX.Element
  items: CommandPaletteItem[]
}

export type CommandPaletteProps = {
  open: boolean
  query: string
  onQueryChange: (query: string) => void
  groups: CommandPaletteGroup[]
  onSelect: (id: string) => void
  placeholder?: string
  emptyText?: JSX.Element
  class?: string
}

export function CommandPalette(props: CommandPaletteProps) {
  const hasItems = () => props.groups.some((group) => group.items.length > 0)

  return (
    <Show when={props.open}>
      <div class={props.class} role="dialog" aria-modal="true" aria-label="命令面板">
        <div class="tbr-command-box">
          <input
            class="tbr-command-input"
            value={props.query}
            placeholder={props.placeholder ?? "搜索命令、卡片或链接..."}
            onInput={(event) => props.onQueryChange(event.currentTarget.value)}
            aria-label="搜索命令"
          />
          <div class="tbr-command-list">
            <Show
              when={hasItems()}
              fallback={<div class="tbr-command-empty">{props.emptyText ?? "没有匹配结果"}</div>}
            >
              <For each={props.groups}>
                {(group) => (
                  <section class="tbr-command-group">
                    <div class="tbr-command-group-label">{group.label}</div>
                    <For each={group.items}>
                      {(item) => (
                        <button
                          type="button"
                          class="tbr-command-item"
                          disabled={item.disabled}
                          onClick={() => props.onSelect(item.id)}
                        >
                          <span class="tbr-command-icon" aria-hidden="true">
                            {item.icon}
                          </span>
                          <span class="tbr-command-text">
                            <span class="tbr-command-title">{item.label}</span>
                            <Show when={item.description}>
                              <span class="tbr-command-desc">{item.description}</span>
                            </Show>
                          </span>
                          <Show when={item.shortcut}>
                            <kbd class="tbr-command-kbd">{item.shortcut}</kbd>
                          </Show>
                        </button>
                      )}
                    </For>
                  </section>
                )}
              </For>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  )
}
