import { createEffect, createMemo, For, Show } from "solid-js"
import type { SearchCommandEntry, SearchHistoryEntry, SearchWidgetEntry } from "@tabora/plugin-api"
import {
  buildSearchUrl,
  createCommandPaletteItems,
  routeSearchQuery,
  type CommandPaletteItem,
  type SearchProviderContributionDescriptor,
} from "@tabora/orchestrator"
import { Kbd } from "@tabora/ui"

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
  // 面板关闭时由宿主重置状态，同时确保外部直接关闭时状态也清零
  createEffect(() => {
    if (!props.isOpen) {
      props.onQueryChange("")
      props.onActiveIdxChange(0)
    }
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
      <div class="cmd-overlay" onClick={close}>
        <div class="cmd-panel" onClick={(event) => event.stopPropagation()}>
          <div class="cmd-input-wrap">
            <svg
              class="cmd-search-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              class="cmd-input"
              type="text"
              value={props.query}
              placeholder={props.copy?.placeholder ?? "搜索命令、卡片或输入 @bing 天气"}
              autofocus
              onInput={(event) => {
                props.onQueryChange(event.currentTarget.value)
                props.onActiveIdxChange(0)
              }}
              onKeyDown={handleKeyDown}
            />
            <span class="cmd-esc">
              <Kbd>esc</Kbd>
            </span>
          </div>
          <div class="cmd-results">
            <Show
              when={items().length > 0}
              fallback={<div class="cmd-empty">{props.copy?.empty ?? "未找到匹配结果"}</div>}
            >
              <For each={Object.entries(grouped())}>
                {([group, groupItems]) => (
                  <>
                    <div class="cmd-group">{group}</div>
                    <For each={groupItems}>
                      {(item) => {
                        const index = items().indexOf(item)
                        return (
                          <button
                            class="cmd-item"
                            classList={{ active: index === props.activeIdx }}
                            onMouseDown={(event) => {
                              event.preventDefault()
                              item.action()
                              if (item.closeAfterAction !== false) {
                                close()
                              }
                            }}
                          >
                            <span class="cmd-item-icon">{item.icon}</span>
                            <span class="cmd-item-text">
                              <span class="cmd-item-name">{item.name}</span>
                              <span class="cmd-item-desc">{item.desc}</span>
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
