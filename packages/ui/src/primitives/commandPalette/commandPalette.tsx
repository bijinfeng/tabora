import { Dialog as KDialog } from "@kobalte/core/dialog"
import type { JSX } from "solid-js"
import { For, Show, splitProps } from "solid-js"

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
  onClose?: () => void
}

export function CommandPalette(props: CommandPaletteProps) {
  const [local] = splitProps(props, [
    "open",
    "query",
    "onQueryChange",
    "groups",
    "onSelect",
    "placeholder",
    "emptyText",
    "class",
    "onClose",
  ])

  const hasItems = () => local.groups.some((group) => group.items.length > 0)

  return (
    <KDialog open={local.open} onOpenChange={(open) => !open && local.onClose?.()}>
      <KDialog.Portal>
        <KDialog.Content class={`tbr-command ${local.class ?? ""}`}>
          <div class="tbr-command-box">
            <input
              class="tbr-command-input"
              value={local.query}
              placeholder={local.placeholder ?? "搜索命令、卡片或链接..."}
              onInput={(event) => local.onQueryChange(event.currentTarget.value)}
              aria-label="搜索命令"
            />
            <div class="tbr-command-list">
              <Show
                when={hasItems()}
                fallback={<div class="tbr-command-empty">{local.emptyText ?? "没有匹配结果"}</div>}
              >
                <For each={local.groups}>
                  {(group) => (
                    <section class="tbr-command-group">
                      <div class="tbr-command-group-label">{group.label}</div>
                      <For each={group.items}>
                        {(item) => (
                          <button
                            type="button"
                            class="tbr-command-item"
                            disabled={item.disabled}
                            onClick={() => local.onSelect(item.id)}
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
        </KDialog.Content>
      </KDialog.Portal>
    </KDialog>
  )
}
