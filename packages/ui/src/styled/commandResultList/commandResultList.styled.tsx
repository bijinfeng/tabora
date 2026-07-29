import * as stylex from "@stylexjs/stylex"
import type { JSX } from "solid-js"
import { For, Show } from "solid-js"

import { color } from "@tabora/theme/tokens.stylex"
import { Button } from "../button"
import { Kbd } from "../kbd"

const styles = stylex.create({
  root: {
    maxHeight: 300,
    overflowX: "hidden",
    overflowY: "auto",
  },
  group: {
    color: color.textSubtle,
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.06em",
    paddingBlockEnd: 2,
    paddingBlockStart: 8,
    paddingInline: 14,
    textTransform: "uppercase",
  },
  item: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 0,
    borderStyle: "none",
    borderWidth: 0,
    color: color.text,
    cursor: "pointer",
    display: "flex",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 400,
    gap: 10,
    height: "auto",
    justifyContent: "flex-start",
    lineHeight: 1.4,
    minHeight: 0,
    paddingBlock: 8,
    paddingInline: 14,
    textAlign: "left",
    width: "100%",
    ":hover": {
      backgroundColor: color.surfaceHover,
    },
  },
  itemActive: {
    backgroundColor: color.surfaceHover,
  },
  icon: {
    alignItems: "center",
    borderRadius: 6,
    color: color.textMuted,
    display: "inline-flex",
    flexShrink: 0,
    fontSize: 12,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  iconAccent: {
    backgroundColor: color.accentSoft,
  },
  text: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    minWidth: 0,
  },
  name: {
    color: color.text,
    fontSize: 13,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  description: {
    color: color.textMuted,
    fontSize: 11,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  hint: {
    backgroundColor: "transparent",
    borderRadius: 0,
    borderStyle: "none",
    borderWidth: 0,
    color: color.textSubtle,
    fontSize: 10,
    fontWeight: 400,
    height: "auto",
    lineHeight: "normal",
    paddingBlock: 0,
    paddingInline: 0,
  },
  empty: {
    color: color.textMuted,
    fontSize: 13,
    padding: 24,
    textAlign: "center",
  },
})

type CommandResultContent = unknown

function renderContent(content: CommandResultContent): JSX.Element {
  return content as JSX.Element
}

export type CommandResultItem = {
  id: string
  icon: CommandResultContent
  name: CommandResultContent
  description?: CommandResultContent
  hint?: string | undefined
  active?: boolean
  accentIcon?: boolean
  onSelect: () => void
}

export type CommandResultGroup = {
  id: string
  label: CommandResultContent
  items: CommandResultItem[]
}

export type CommandResultListProps = {
  groups: CommandResultGroup[]
  emptyText?: CommandResultContent
}

export function CommandResultList(props: CommandResultListProps) {
  const hasItems = () => props.groups.some((group) => group.items.length > 0)

  return (
    <div {...stylex.attrs(styles.root)} data-command-result-list>
      <Show
        when={hasItems()}
        fallback={
          <div {...stylex.attrs(styles.empty)}>
            {renderContent(props.emptyText ?? "未找到匹配结果")}
          </div>
        }
      >
        <For each={props.groups}>
          {(group) => (
            <section>
              <div {...stylex.attrs(styles.group)} data-command-result-group>
                {renderContent(group.label)}
              </div>
              <For each={group.items}>
                {(item) => (
                  <Button
                    size="md"
                    variant="ghost"
                    xstyle={[styles.item, item.active && styles.itemActive]}
                    data-command-result-item
                    data-active={item.active ? "" : undefined}
                    onMouseDown={(event) => {
                      event.preventDefault()
                      item.onSelect()
                    }}
                  >
                    <span
                      {...stylex.attrs(styles.icon, item.accentIcon && styles.iconAccent)}
                      data-command-result-icon
                    >
                      {renderContent(item.icon)}
                    </span>
                    <span {...stylex.attrs(styles.text)}>
                      <span {...stylex.attrs(styles.name)} data-command-result-name>
                        {renderContent(item.name)}
                      </span>
                      <Show when={item.description !== undefined}>
                        <span {...stylex.attrs(styles.description)}>
                          {renderContent(item.description)}
                        </span>
                      </Show>
                    </span>
                    <Show when={item.hint}>
                      <Kbd xstyle={styles.hint}>{item.hint!}</Kbd>
                    </Show>
                  </Button>
                )}
              </For>
            </section>
          )}
        </For>
      </Show>
    </div>
  )
}
