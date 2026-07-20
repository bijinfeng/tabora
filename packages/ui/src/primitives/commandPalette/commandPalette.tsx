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
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  boxClass?: string | undefined
  boxStyle?: JSX.CSSProperties | undefined
  inputClass?: string | undefined
  inputStyle?: JSX.CSSProperties | undefined
  listClass?: string | undefined
  listStyle?: JSX.CSSProperties | undefined
  emptyClass?: string | undefined
  emptyStyle?: JSX.CSSProperties | undefined
  groupClass?: string | undefined
  groupStyle?: JSX.CSSProperties | undefined
  groupLabelClass?: string | undefined
  groupLabelStyle?: JSX.CSSProperties | undefined
  itemClass?: string | undefined
  itemStyle?: JSX.CSSProperties | undefined
  iconClass?: string | undefined
  iconStyle?: JSX.CSSProperties | undefined
  textClass?: string | undefined
  textStyle?: JSX.CSSProperties | undefined
  titleClass?: string | undefined
  titleStyle?: JSX.CSSProperties | undefined
  descriptionClass?: string | undefined
  descriptionStyle?: JSX.CSSProperties | undefined
  kbdClass?: string | undefined
  kbdStyle?: JSX.CSSProperties | undefined
  onClose?: () => void
}

function optionalPartProps(className: string | undefined, style: JSX.CSSProperties | undefined) {
  return {
    ...(className !== undefined ? { class: className } : {}),
    ...(style !== undefined ? { style } : {}),
  }
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
    "style",
    "boxClass",
    "boxStyle",
    "inputClass",
    "inputStyle",
    "listClass",
    "listStyle",
    "emptyClass",
    "emptyStyle",
    "groupClass",
    "groupStyle",
    "groupLabelClass",
    "groupLabelStyle",
    "itemClass",
    "itemStyle",
    "iconClass",
    "iconStyle",
    "textClass",
    "textStyle",
    "titleClass",
    "titleStyle",
    "descriptionClass",
    "descriptionStyle",
    "kbdClass",
    "kbdStyle",
    "onClose",
  ])

  const hasItems = () => local.groups.some((group) => group.items.length > 0)

  return (
    <KDialog open={local.open} onOpenChange={(open) => !open && local.onClose?.()}>
      <KDialog.Portal>
        <KDialog.Content {...optionalPartProps(local.class, local.style)}>
          <div class={local.boxClass} style={local.boxStyle}>
            <input
              class={local.inputClass}
              style={local.inputStyle}
              value={local.query}
              placeholder={local.placeholder ?? "搜索命令、卡片或链接..."}
              onInput={(event) => local.onQueryChange(event.currentTarget.value)}
              aria-label="搜索命令"
            />
            <div class={local.listClass} style={local.listStyle}>
              <Show
                when={hasItems()}
                fallback={
                  <div class={local.emptyClass} style={local.emptyStyle}>
                    {local.emptyText ?? "没有匹配结果"}
                  </div>
                }
              >
                <For each={local.groups}>
                  {(group) => (
                    <section class={local.groupClass} style={local.groupStyle}>
                      <div class={local.groupLabelClass} style={local.groupLabelStyle}>
                        {group.label}
                      </div>
                      <For each={group.items}>
                        {(item) => (
                          <button
                            type="button"
                            class={local.itemClass}
                            style={local.itemStyle}
                            disabled={item.disabled}
                            onClick={() => local.onSelect(item.id)}
                          >
                            <span
                              class={local.iconClass}
                              style={local.iconStyle}
                              aria-hidden="true"
                            >
                              {item.icon}
                            </span>
                            <span class={local.textClass} style={local.textStyle}>
                              <span class={local.titleClass} style={local.titleStyle}>
                                {item.label}
                              </span>
                              <Show when={item.description}>
                                <span class={local.descriptionClass} style={local.descriptionStyle}>
                                  {item.description}
                                </span>
                              </Show>
                            </span>
                            <Show when={item.shortcut}>
                              <kbd class={local.kbdClass} style={local.kbdStyle}>
                                {item.shortcut}
                              </kbd>
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
