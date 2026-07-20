import * as stylex from "@stylexjs/stylex"
import { createEffect, createMemo, For, Show } from "solid-js"
import { History, Search } from "lucide-solid"
import type { SearchCommandEntry, SearchHistoryEntry, SearchWidgetEntry } from "@tabora/plugin-api"
import {
  buildSearchUrl,
  createCommandPaletteItems,
  routeSearchQuery,
  type CommandPaletteItem,
  type SearchProviderContributionDescriptor,
} from "@tabora/orchestrator"
import { Kbd } from "@tabora/ui"
import { color, font, motion, radius, shadow, zIndex } from "./stylexTokens.stylex"

const styles = stylex.create({
  overlay: {
    alignItems: "flex-start",
    backdropFilter: "blur(2px)",
    backgroundColor: "rgb(var(--tbr-color-scrim) / 0.2)",
    display: "flex",
    inset: 0,
    justifyContent: "center",
    paddingTop: "15vh",
    position: "fixed",
    zIndex: zIndex.overlay,
  },
  panel: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.panel,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: shadow.floating,
    maxWidth: "90vw",
    overflow: "hidden",
    width: 520,
  },
  inputWrap: {
    alignItems: "center",
    borderBottomColor: color.line,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "flex",
    gap: 10,
    paddingBlock: 12,
    paddingInline: 16,
    transitionDuration: motion.fast,
    transitionProperty: "border-color, box-shadow",
    transitionTimingFunction: motion.ease,
    ":focus-within": {
      borderBottomColor: color.accent,
      boxShadow: "inset 0 1px 2px rgb(var(--tbr-color-accent) / 0.08)",
    },
  },
  searchIcon: {
    color: color.textMuted,
    flexShrink: 0,
  },
  input: {
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    color: color.text,
    flex: 1,
    fontFamily: font.sans,
    fontSize: 14,
    minWidth: 0,
    outline: "none",
    "::placeholder": {
      color: color.textSubtle,
    },
  },
  escape: {
    flexShrink: 0,
    opacity: 0.58,
  },
  results: {
    maxHeight: 300,
    overflowY: "auto",
  },
  group: {
    color: color.textSubtle,
    fontSize: 10,
    fontWeight: font.bold,
    letterSpacing: "0.06em",
    paddingBottom: 2,
    paddingLeft: 14,
    paddingRight: 14,
    paddingTop: 8,
    textTransform: "uppercase",
  },
  item: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    color: color.text,
    cursor: "pointer",
    display: "flex",
    fontFamily: font.sans,
    fontSize: 13,
    gap: 10,
    paddingBlock: 9,
    paddingInline: 14,
    textAlign: "left",
    transitionDuration: motion.fast,
    transitionProperty: "background-color",
    transitionTimingFunction: motion.ease,
    width: "100%",
    ":hover": {
      backgroundColor: color.surfaceHover,
    },
    ":focus-visible": {
      backgroundColor: color.surfaceHover,
      outlineColor: color.focus,
      outlineOffset: -2,
      outlineStyle: "solid",
      outlineWidth: 2,
    },
  },
  itemActive: {
    backgroundColor: color.surfaceHover,
  },
  itemIcon: {
    alignItems: "center",
    backgroundColor: color.surfaceSoft,
    borderRadius: radius.control,
    display: "flex",
    flexShrink: 0,
    fontSize: 12,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  itemText: {
    flex: 1,
    lineHeight: 1.25,
    minWidth: 0,
    textAlign: "left",
  },
  itemName: {
    display: "block",
  },
  itemDescription: {
    color: color.textMuted,
    display: "block",
    fontSize: 11,
    lineHeight: 1.25,
  },
  empty: {
    color: color.textMuted,
    fontSize: 13,
    padding: 24,
    textAlign: "center",
  },
})

// Map icon names to lucide components
function getIconComponent(iconName: string) {
  switch (iconName) {
    case "history":
      return <History size={16} />
    case "search":
      return <Search size={16} />
    default:
      return iconName // Fallback to string for unknown icons
  }
}

export type CommandItem = SearchCommandEntry

export type CommandPaletteProps = {
  isOpen: boolean
  query: string
  activeIdx: number
  onQueryChange: (query: string) => void
  onActiveIdxChange: (index: number | ((current: number) => number)) => void
  onClose: () => void
  commands: SearchCommandEntry[]
  widgets?: SearchWidgetEntry[]
  providers?: SearchProviderContributionDescriptor[]
  defaultProviderId?: string
  searchHistory?: SearchHistoryEntry[]
  openExternalForPlugin?: (request: { pluginId: string; url: string }) => boolean
  onSaveHistory?: (entry: { query: string; providerId: string }) => Promise<void>
  copy?: {
    placeholder: string
    empty: string
  }
}

export function CommandPalette(props: CommandPaletteProps) {
  let inputRef: HTMLInputElement | undefined
  let previousFocusedElement: HTMLElement | null = null
  // 面板关闭时由宿主重置状态，同时确保外部直接关闭时状态也清零
  createEffect(() => {
    if (!props.isOpen) {
      props.onQueryChange("")
      props.onActiveIdxChange(0)
    }
  })

  createEffect(() => {
    if (props.isOpen) {
      previousFocusedElement =
        document.activeElement instanceof HTMLElement ? document.activeElement : null
      inputRef?.focus()
      return
    }

    if (previousFocusedElement && document.contains(previousFocusedElement)) {
      previousFocusedElement.focus()
    }
    previousFocusedElement = null
  })

  function close() {
    props.onClose()
  }

  function runWebSearch(provider: SearchProviderContributionDescriptor, searchQuery: string) {
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    if (
      !props.openExternalForPlugin?.({
        pluginId: provider.pluginId,
        url: buildSearchUrl(provider, trimmed),
      })
    ) {
      return
    }
    void props.onSaveHistory?.({ query: trimmed, providerId: provider.id })
  }

  const items = createMemo((): CommandPaletteItem[] =>
    createCommandPaletteItems({
      query: props.query,
      commands: props.commands,
      widgets: props.widgets,
      providers: props.providers,
      defaultProviderId: props.defaultProviderId,
      history: props.searchHistory,
      onProviderTokenSelect: (token) => {
        props.onQueryChange(`@${token} `)
        props.onActiveIdxChange(0)
      },
      onWebSearch: runWebSearch,
    }),
  )

  const grouped = createMemo(() => {
    const groups: Record<string, CommandPaletteItem[]> = {}
    for (const item of items()) {
      const bucket = groups[item.group] ?? (groups[item.group] = [])
      bucket.push(item)
    }
    return groups
  })

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      props.onActiveIdxChange((index) => Math.min(index + 1, items().length - 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      props.onActiveIdxChange((index) => Math.max(index - 1, 0))
    } else if (event.key === "Enter") {
      event.preventDefault()
      const item = items()[props.activeIdx]
      if (item) {
        item.action()
        if (item.closeAfterAction !== false) {
          close()
        }
      } else {
        const route = routeSearchQuery(
          props.query,
          props.providers ?? [],
          props.defaultProviderId ?? "",
        )
        if (route?.type === "provider") {
          runWebSearch(route.provider, route.query)
          close()
        } else if (route?.type === "web") {
          runWebSearch(route.provider, route.query)
          close()
        }
      }
    } else if (event.key === "Escape") {
      close()
    }
  }

  return (
    <Show when={props.isOpen}>
      <div
        {...stylex.props(styles.overlay)}
        data-command-palette-overlay
        onClick={close}
        role="dialog"
        aria-modal="true"
        aria-label="命令面板"
      >
        <div
          {...stylex.props(styles.panel)}
          data-command-palette-panel
          onClick={(event) => event.stopPropagation()}
        >
          <div {...stylex.props(styles.inputWrap)}>
            <span {...stylex.props(styles.searchIcon)} aria-hidden="true">
              <Search size={16} />
            </span>
            <input
              {...stylex.props(styles.input)}
              data-command-palette-input
              type="text"
              value={props.query}
              placeholder={props.copy?.placeholder ?? "搜索命令、卡片或输入 @bing 天气"}
              autofocus
              ref={(element) => {
                inputRef = element
              }}
              onInput={(event) => {
                props.onQueryChange(event.currentTarget.value)
                props.onActiveIdxChange(0)
              }}
              onKeyDown={handleKeyDown}
              aria-label={props.copy?.placeholder ?? "搜索命令、卡片或网页"}
            />
            <span {...stylex.props(styles.escape)}>
              <Kbd>esc</Kbd>
            </span>
          </div>
          <div {...stylex.props(styles.results)}>
            <Show
              when={items().length > 0}
              fallback={
                <div {...stylex.props(styles.empty)}>{props.copy?.empty ?? "未找到匹配结果"}</div>
              }
            >
              <For each={Object.entries(grouped())}>
                {([group, groupItems]) => (
                  <>
                    <div {...stylex.props(styles.group)}>{group}</div>
                    <For each={groupItems}>
                      {(item) => {
                        const index = items().indexOf(item)
                        return (
                          <button
                            {...stylex.props(
                              styles.item,
                              index === props.activeIdx && styles.itemActive,
                            )}
                            type="button"
                            data-command-palette-item
                            data-active={index === props.activeIdx ? "" : undefined}
                            onMouseDown={(event) => {
                              event.preventDefault()
                              item.action()
                              if (item.closeAfterAction !== false) {
                                close()
                              }
                            }}
                          >
                            <span {...stylex.props(styles.itemIcon)}>
                              {getIconComponent(item.icon)}
                            </span>
                            <span {...stylex.props(styles.itemText)}>
                              <span {...stylex.props(styles.itemName)}>{item.name}</span>
                              <span {...stylex.props(styles.itemDescription)}>{item.desc}</span>
                            </span>
                            <Show when={item.hint}>
                              <Kbd>{item.hint!}</Kbd>
                            </Show>
                          </button>
                        )
                      }}
                    </For>
                  </>
                )}
              </For>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  )
}
