import * as stylex from "@stylexjs/stylex"
import { createEffect, createMemo, Show } from "solid-js"
import {
  AtSign,
  Circle,
  CircleHelp,
  Command,
  CornerDownLeft,
  History,
  LayoutDashboard,
  Link2,
  PanelTop,
  Plus,
  Puzzle,
  Search,
  Settings,
  SunMoon,
  Target,
  Pencil,
  CheckSquare,
} from "lucide-solid"
import type { SearchCommandEntry, SearchHistoryEntry, SearchWidgetEntry } from "@tabora/plugin-api"
import {
  buildSearchUrl,
  createCommandPaletteItems,
  routeSearchQuery,
  type CommandPaletteItem,
  type SearchProviderContributionDescriptor,
} from "@tabora/orchestrator"
import { CommandResultList, Input, Kbd } from "@tabora/ui"
import { color, font, motion, radius, shadow, zIndex } from "@tabora/theme/tokens.stylex"

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
})

function getIconComponent(item: CommandPaletteItem) {
  switch (item.icon) {
    case "history":
      return <History size={16} />
    case "search":
      return <Search size={16} />
    case "at-sign":
      return <AtSign size={16} />
    case "command":
      return <Command size={16} />
    case "corner-down-left":
      return <CornerDownLeft size={16} />
    case "theme":
      return <SunMoon size={16} />
    case "layout-dashboard":
      return <LayoutDashboard size={16} />
    case "plus":
      return <Plus size={16} />
    case "puzzle":
      return <Puzzle size={16} />
    case "settings":
      return <Settings size={16} />
    case "circle-help":
      return <CircleHelp size={16} />
    case "target":
      return <Target size={16} />
    case "link":
      return <Link2 size={16} />
    case "pencil":
      return <Pencil size={16} />
    case "check-square":
      return <CheckSquare size={16} />
    case "sun":
      return <SunMoon size={16} />
  }

  if (item.id.startsWith("provider-")) return <AtSign size={16} />
  if (item.id.includes("search")) return <Search size={16} />
  if (item.id.includes("command")) return <Command size={16} />
  if (item.id.includes("theme")) return <SunMoon size={16} />
  if (item.id.includes("layout")) return <LayoutDashboard size={16} />
  if (item.id.includes("add")) return <Plus size={16} />
  if (item.id.includes("widget")) return <PanelTop size={16} />
  if (item.id.includes("plugin")) return <Puzzle size={16} />
  if (item.id.includes("settings")) return <Settings size={16} />
  return <Circle size={16} />
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
        {...stylex.attrs(styles.overlay)}
        data-command-palette-overlay
        onClick={close}
        role="dialog"
        aria-modal="true"
        aria-label="命令面板"
      >
        <div
          {...stylex.attrs(styles.panel)}
          data-command-palette-panel
          onClick={(event) => event.stopPropagation()}
        >
          <div {...stylex.attrs(styles.inputWrap)}>
            <span {...stylex.attrs(styles.searchIcon)} aria-hidden="true">
              <Search size={16} />
            </span>
            <Input
              xstyle={styles.input}
              inputAttrs={{ "data-command-palette-input": "" }}
              type="text"
              value={props.query}
              placeholder={props.copy?.placeholder ?? "搜索命令、卡片或输入 @bing 天气"}
              autofocus
              ref={(element) => {
                inputRef = element
              }}
              onInput={(value) => {
                props.onQueryChange(value)
                props.onActiveIdxChange(0)
              }}
              onKeyDown={handleKeyDown}
              aria-label={props.copy?.placeholder ?? "搜索命令、卡片或网页"}
            />
            <span {...stylex.attrs(styles.escape)}>
              <Kbd>esc</Kbd>
            </span>
          </div>
          <CommandResultList
            groups={Object.entries(grouped()).map(([group, groupItems]) => ({
              id: group,
              label: group,
              items: groupItems.map((item) => {
                const index = items().indexOf(item)
                return {
                  id: item.id,
                  icon: getIconComponent(item),
                  name: item.name,
                  description: item.desc,
                  hint: item.hint,
                  active: index === props.activeIdx,
                  onSelect: () => {
                    item.action()
                    if (item.closeAfterAction !== false) {
                      close()
                    }
                  },
                }
              }),
            }))}
            emptyText={props.copy?.empty ?? "未找到匹配结果"}
          />
        </div>
      </div>
    </Show>
  )
}
