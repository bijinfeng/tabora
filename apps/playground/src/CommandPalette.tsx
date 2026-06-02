import { createMemo, createSignal, For, Show } from "solid-js"
import type {
  SearchCommandEntry,
  SearchHistoryEntry,
  SearchProviderContribution,
  SearchWidgetEntry,
} from "@tabora/plugin-api"
import { buildSearchUrl, matchProvidersByToken, routeSearchQuery } from "@tabora/official-plugins"
import { Kbd } from "@tabora/ui"

export type CommandItem = SearchCommandEntry

type PaletteItem = {
  id: string
  icon: string
  name: string
  desc: string
  group: string
  hint: string | undefined
  action: () => void
  closeAfterAction: boolean | undefined
}

export type CommandPaletteProps = {
  isOpen: boolean
  onClose: () => void
  commands: SearchCommandEntry[]
  widgets?: SearchWidgetEntry[]
  providers?: SearchProviderContribution[]
  defaultProviderId?: string
  searchHistory?: SearchHistoryEntry[]
  openExternal?: (url: string) => boolean
  onSaveHistory?: (entry: { query: string; providerId: string }) => Promise<void>
}

function includesText(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.toLowerCase())
}

function providerToken(provider: SearchProviderContribution): string {
  return provider.shortcut || provider.id.split(".").at(-1) || provider.title.toLowerCase()
}

export function CommandPalette(props: CommandPaletteProps) {
  const [query, setQuery] = createSignal("")
  const [activeIdx, setActiveIdx] = createSignal(0)

  function close() {
    setQuery("")
    setActiveIdx(0)
    props.onClose()
  }

  function runWebSearch(provider: SearchProviderContribution, searchQuery: string) {
    const trimmed = searchQuery.trim()
    if (!trimmed) return
    if (!props.openExternal?.(buildSearchUrl(provider, trimmed))) return
    void props.onSaveHistory?.({ query: trimmed, providerId: provider.id })
  }

  const items = createMemo((): PaletteItem[] => {
    const trimmed = query().trim()
    const history = (props.searchHistory ?? []).slice().reverse()
    const providers = props.providers ?? []
    const widgets = props.widgets ?? []
    const defaultProviderId = props.defaultProviderId ?? providers[0]?.id ?? ""

    if (!trimmed) {
      return [
        ...props.commands.slice(0, 4).map((command) => ({
          ...command,
          group: "常用命令",
          hint: command.shortcut,
          closeAfterAction: true,
        })),
        ...history.slice(0, 4).map((entry) => ({
          id: `history-${entry.providerId}-${entry.timestamp}`,
          icon: "🕘",
          name: entry.query,
          desc: `最近搜索 · ${
            providers.find((provider) => provider.id === entry.providerId)?.title ??
            entry.providerId
          }`,
          group: "最近搜索",
          hint: providers.find((provider) => provider.id === entry.providerId)?.shortcut,
          action: () => {
            const provider = providers.find((item) => item.id === entry.providerId)
            if (provider) runWebSearch(provider, entry.query)
          },
          closeAfterAction: true,
        })),
        ...providers.slice(0, 4).map((provider) => ({
          id: `provider-${provider.id}`,
          icon: "＠",
          name: `@${providerToken(provider)}`,
          desc: `搜索源 · ${provider.title}`,
          group: "搜索源",
          hint: provider.shortcut,
          action: () => {
            setQuery(`@${providerToken(provider)} `)
            setActiveIdx(0)
          },
          closeAfterAction: false,
        })),
      ]
    }

    const route = routeSearchQuery(trimmed, providers, defaultProviderId)
    if (route?.type === "provider-pending") {
      return matchProvidersByToken(providers, route.token).map((provider) => ({
        id: `provider-pending-${provider.id}`,
        icon: "＠",
        name: `@${providerToken(provider)}`,
        desc: `搜索源 · ${provider.title}`,
        group: "搜索源",
        hint: provider.shortcut,
        action: () => {
          setQuery(`@${providerToken(provider)} `)
          setActiveIdx(0)
        },
        closeAfterAction: false,
      }))
    }

    if (route?.type === "provider") {
      return [
        {
          id: `provider-search-${route.provider.id}`,
          icon: "🔍",
          name: `在 ${route.provider.title} 中搜索 "${route.query}"`,
          desc: "临时搜索源",
          group: "搜索",
          hint: route.provider.shortcut,
          action: () => runWebSearch(route.provider, route.query),
          closeAfterAction: true,
        },
      ]
    }

    const results: PaletteItem[] = []
    results.push(
      ...props.commands
        .filter(
          (command) => includesText(command.name, trimmed) || includesText(command.desc, trimmed),
        )
        .map((command) => ({
          ...command,
          group: "命令",
          hint: command.shortcut,
          closeAfterAction: true,
        })),
    )
    results.push(
      ...widgets
        .filter(
          (widget) => includesText(widget.name, trimmed) || includesText(widget.desc, trimmed),
        )
        .map((widget) => ({
          id: `widget-${widget.instanceId}`,
          icon: widget.icon,
          name: widget.name,
          desc: widget.desc,
          action: widget.action,
          group: "卡片",
          hint: undefined,
          closeAfterAction: true,
        })),
    )

    if (route?.type === "web") {
      results.push({
        id: `web-${route.provider.id}-${route.query}`,
        icon: "🔍",
        name: `在 ${route.provider.title} 中搜索 "${route.query}"`,
        desc: "网页搜索",
        group: "搜索",
        hint: route.provider.shortcut,
        action: () => runWebSearch(route.provider, route.query),
        closeAfterAction: true,
      })
    }

    return results
  })

  const grouped = createMemo(() => {
    const groups: Record<string, PaletteItem[]> = {}
    for (const item of items()) {
      const bucket = groups[item.group] ?? (groups[item.group] = [])
      bucket.push(item)
    }
    return groups
  })

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setActiveIdx((index) => Math.min(index + 1, items().length - 1))
    } else if (event.key === "ArrowUp") {
      event.preventDefault()
      setActiveIdx((index) => Math.max(index - 1, 0))
    } else if (event.key === "Enter") {
      event.preventDefault()
      const item = items()[activeIdx()]
      if (item) {
        item.action()
        if (item.closeAfterAction !== false) {
          close()
        }
      } else {
        const route = routeSearchQuery(
          query(),
          props.providers ?? [],
          props.defaultProviderId ?? props.providers?.[0]?.id ?? "",
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
              value={query()}
              placeholder="搜索命令、卡片或输入 @bing 天气"
              autofocus
              onInput={(event) => {
                setQuery(event.currentTarget.value)
                setActiveIdx(0)
              }}
              onKeyDown={handleKeyDown}
            />
            <span class="cmd-esc">
              <Kbd>esc</Kbd>
            </span>
          </div>
          <div class="cmd-results">
            <Show when={items().length > 0} fallback={<div class="cmd-empty">未找到匹配结果</div>}>
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
                            classList={{ active: index === activeIdx() }}
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
