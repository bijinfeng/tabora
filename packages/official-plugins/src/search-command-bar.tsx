import { createMemo, createSignal, For, Show } from "solid-js"
import type {
  SearchHistoryEntry,
  SearchProviderContribution,
  SearchViewProps,
} from "@tabora/plugin-api"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { InlineError, Kbd } from "@tabora/ui"

import {
  buildSearchUrl,
  matchProvidersByToken,
  resolveDefaultProvider,
  routeSearchQuery,
} from "./search-model"

const FALLBACK_PROVIDER: SearchProviderContribution = {
  id: "official.search.google",
  title: "Google",
  urlTemplate: "https://www.google.com/search?q={query}",
  shortcut: "g",
}

type Suggestion = {
  id: string
  icon: string
  name: string
  desc: string
  group: string
  hint: string | undefined
  action: () => void
  clearAfterAction: boolean | undefined
}

function includesText(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.toLowerCase())
}

function providerToken(provider: SearchProviderContribution): string {
  return provider.shortcut || provider.id.split(".").at(-1) || provider.title.toLowerCase()
}

function historyLabel(entry: SearchHistoryEntry, providers: SearchProviderContribution[]): string {
  return providers.find((provider) => provider.id === entry.providerId)?.title ?? entry.providerId
}

export function safelyHandleProviderChange(
  onChange: ((id: string) => void | Promise<void>) | undefined,
  nextProviderId: string,
): void {
  const result = onChange?.(nextProviderId)
  if (result instanceof Promise) {
    result.catch((error) => {
      console.warn("Failed to change default provider:", error)
    })
  }
}

export function SearchCommandBar(props: SearchViewProps) {
  const providers = createMemo(() =>
    props.providers.length > 0 ? props.providers : [FALLBACK_PROVIDER],
  )
  const [providerId, setProviderId] = createSignal(props.defaultProviderId || providers()[0]!.id)
  const [query, setQuery] = createSignal("")
  const [focused, setFocused] = createSignal(false)
  const [providerOpen, setProviderOpen] = createSignal(false)
  const [permissionDenied, setPermissionDenied] = createSignal(false)
  const [suggestIdx, setSuggestIdx] = createSignal(-1)

  const commands = createMemo(() => props.commands ?? [])
  const widgets = createMemo(() => props.widgets ?? [])
  const activeProvider = createMemo(
    () => resolveDefaultProvider(providers(), providerId()) ?? providers()[0]!,
  )
  const route = createMemo(() =>
    routeSearchQuery(query(), providers(), providerId() || activeProvider().id),
  )
  const providerStateLabel = createMemo(() => {
    const currentRoute = route()
    if (currentRoute?.type === "provider-pending") {
      return currentRoute.provider
        ? `@${providerToken(currentRoute.provider)}`
        : `@${query().trim().slice(1)}`
    }
    if (currentRoute?.type === "provider") {
      return currentRoute.provider.title
    }
    return ""
  })

  function doSearch(targetQuery: string, targetProvider?: SearchProviderContribution) {
    const trimmed = targetQuery.trim()
    if (!trimmed) return
    setPermissionDenied(false)
    const provider = targetProvider ?? activeProvider()
    const opened = props.openExternal?.(buildSearchUrl(provider, trimmed))
    if (!opened) {
      setPermissionDenied(true)
      return
    }
    void props.onSaveHistory?.({ query: trimmed, providerId: provider.id })
  }

  function createHistorySuggestion(entry: SearchHistoryEntry): Suggestion {
    return {
      id: `history-${entry.providerId}-${entry.timestamp}`,
      icon: "🕘",
      name: entry.query,
      desc: `最近搜索 · ${historyLabel(entry, providers())}`,
      group: "最近搜索",
      hint: providers().find((provider) => provider.id === entry.providerId)?.shortcut,
      action: () => {
        const provider = providers().find((item) => item.id === entry.providerId)
        if (provider) {
          doSearch(entry.query, provider)
        }
      },
      clearAfterAction: true,
    }
  }

  const suggestions = createMemo((): Suggestion[] => {
    const trimmed = query().trim()
    const history = (props.searchHistory ?? []).slice().reverse()

    if (!trimmed) {
      return [
        ...commands()
          .slice(0, 4)
          .map((command) => ({
            ...command,
            group: "常用命令",
            hint: command.shortcut,
            clearAfterAction: true,
          })),
        ...history.slice(0, 3).map(createHistorySuggestion),
        ...providers()
          .slice(0, 4)
          .map((provider) => ({
            id: `provider-${provider.id}`,
            icon: "＠",
            name: `@${providerToken(provider)}`,
            desc: `搜索源 · ${provider.title}`,
            group: "搜索源",
            hint: provider.shortcut,
            action: () => {
              setQuery(`@${providerToken(provider)} `)
              setSuggestIdx(-1)
            },
            clearAfterAction: false,
          })),
        ...widgets()
          .slice(0, 4)
          .map((widget) => ({
            id: `widget-${widget.instanceId}`,
            icon: widget.icon,
            name: widget.name,
            desc: widget.desc,
            action: widget.action,
            group: "核心卡片",
            hint: undefined,
            clearAfterAction: true,
          })),
      ]
    }

    const nextSuggestions: Suggestion[] = []
    const currentRoute = route()
    if (currentRoute?.type === "provider-pending") {
      return matchProvidersByToken(providers(), currentRoute.token).map((provider) => ({
        id: `provider-pending-${provider.id}`,
        icon: "＠",
        name: `@${providerToken(provider)}`,
        desc: `搜索源 · ${provider.title}`,
        group: "搜索源",
        hint: provider.shortcut,
        action: () => {
          setQuery(`@${providerToken(provider)} `)
          setSuggestIdx(-1)
        },
        clearAfterAction: false,
      }))
    }

    if (currentRoute?.type === "provider") {
      return [
        {
          id: `search-${currentRoute.provider.id}`,
          icon: "🔍",
          name: `在 ${currentRoute.provider.title} 中搜索 "${currentRoute.query}"`,
          desc: "临时搜索源",
          group: "搜索",
          hint: currentRoute.provider.shortcut,
          action: () => doSearch(currentRoute.query, currentRoute.provider),
          clearAfterAction: true,
        },
      ]
    }

    const commandMatches = commands().filter(
      (command) => includesText(command.name, trimmed) || includesText(command.desc, trimmed),
    )
    const widgetMatches = widgets().filter(
      (widget) => includesText(widget.name, trimmed) || includesText(widget.desc, trimmed),
    )
    const historyMatches = history.filter(
      (entry) =>
        includesText(entry.query, trimmed) ||
        includesText(historyLabel(entry, providers()), trimmed),
    )

    nextSuggestions.push(
      ...commandMatches.map((command) => ({
        ...command,
        group: "命令",
        hint: command.shortcut,
        clearAfterAction: true,
      })),
    )
    nextSuggestions.push(
      ...widgetMatches.map((widget) => ({
        id: `widget-${widget.instanceId}`,
        icon: widget.icon,
        name: widget.name,
        desc: widget.desc,
        action: widget.action,
        group: "卡片",
        hint: undefined,
        clearAfterAction: true,
      })),
    )
    nextSuggestions.push(...historyMatches.slice(0, 3).map(createHistorySuggestion))

    if (currentRoute?.type === "web") {
      nextSuggestions.push({
        id: `web-${currentRoute.provider.id}-${currentRoute.query}`,
        icon: "🔍",
        name: `在 ${currentRoute.provider.title} 中搜索 "${currentRoute.query}"`,
        desc: "网页搜索",
        group: "搜索",
        hint: currentRoute.provider.shortcut,
        action: () => doSearch(currentRoute.query, currentRoute.provider),
        clearAfterAction: true,
      })
    }

    return nextSuggestions
  })

  const groupedSuggestions = createMemo(() => {
    const groups: Record<string, Suggestion[]> = {}
    for (const suggestion of suggestions()) {
      const bucket = groups[suggestion.group] ?? (groups[suggestion.group] = [])
      bucket.push(suggestion)
    }
    return groups
  })

  function submitCurrentQuery() {
    const currentRoute = route()
    if (!currentRoute) return
    if (currentRoute.type === "provider-pending") return
    if (currentRoute.type === "provider") {
      doSearch(currentRoute.query, currentRoute.provider)
    } else {
      doSearch(currentRoute.query, currentRoute.provider)
    }
    setQuery("")
    setSuggestIdx(-1)
  }

  function handleSubmit(event: Event) {
    event.preventDefault()
    submitCurrentQuery()
  }

  function handleKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowDown") {
      event.preventDefault()
      setSuggestIdx((index) => Math.min(index + 1, suggestions().length - 1))
      return
    }

    if (event.key === "ArrowUp") {
      event.preventDefault()
      setSuggestIdx((index) => Math.max(index - 1, 0))
      return
    }

    if (event.key === "Enter") {
      event.preventDefault()
      const activeSuggestion = suggestions()[suggestIdx()]
      if (activeSuggestion) {
        activeSuggestion.action()
        if (activeSuggestion.clearAfterAction !== false) {
          setQuery("")
          setSuggestIdx(-1)
        }
      } else {
        submitCurrentQuery()
      }
      return
    }

    if (event.key === "Escape") {
      setSuggestIdx(-1)
      setFocused(false)
    }
  }

  function handleProviderChange(nextProviderId: string) {
    setProviderId(nextProviderId)
    setProviderOpen(false)
    safelyHandleProviderChange(props.onDefaultProviderChange, nextProviderId)
  }

  return (
    <div class="search-wrapper">
      <form class="search-bar" onSubmit={handleSubmit}>
        <div class="search-provider">
          <button
            class="search-provider-btn"
            type="button"
            aria-label="切换搜索引擎"
            aria-expanded={providerOpen()}
            onClick={() => setProviderOpen((open) => !open)}
          >
            <span class="search-provider-dot" aria-hidden="true" />
            <span class="search-provider-label">{activeProvider().title}</span>
            <span class="search-provider-caret">▾</span>
          </button>
          <Show when={providerOpen()}>
            <div class="search-provider-dropdown">
              <For each={providers()}>
                {(provider) => (
                  <button
                    class="sp-option"
                    classList={{ active: provider.id === activeProvider().id }}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault()
                      handleProviderChange(provider.id)
                    }}
                  >
                    <span class="sp-check">{provider.id === activeProvider().id ? "✓" : ""}</span>
                    <span>{provider.title}</span>
                  </button>
                )}
              </For>
            </div>
          </Show>
        </div>
        <span class="search-scope-divider" aria-hidden="true" />
        <input
          value={query()}
          onInput={(event) => {
            setQuery(event.currentTarget.value)
            setSuggestIdx(-1)
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() =>
            setTimeout(() => {
              setFocused(false)
              setProviderOpen(false)
              setSuggestIdx(-1)
            }, 200)
          }
          placeholder="搜索网页、命令或卡片"
          aria-label="搜索内容"
          type="search"
        />
        <span class="search-kbd">⌘K</span>
      </form>

      <Show when={route()?.type === "provider-pending"}>
        <div class="search-provider-state">
          继续输入查询以使用临时搜索源：
          <strong>{` ${providerStateLabel()}`}</strong>
        </div>
      </Show>

      <Show when={route()?.type === "provider"}>
        <div class="search-provider-state">
          当前临时搜索源：
          <strong>{` ${providerStateLabel()}`}</strong>
        </div>
      </Show>

      <Show when={permissionDenied()}>
        <InlineError>无法打开该搜索源，请检查插件权限</InlineError>
      </Show>

      <Show when={focused() && suggestions().length > 0}>
        <div class="search-suggestions">
          <For each={Object.entries(groupedSuggestions())}>
            {([group, items]) => (
              <>
                <div class="suggestions-label">{group}</div>
                <For each={items}>
                  {(item) => {
                    const globalIdx = suggestions().indexOf(item)
                    return (
                      <button
                        class="suggestion-item"
                        classList={{ active: suggestIdx() === globalIdx }}
                        onMouseDown={(event) => {
                          event.preventDefault()
                          item.action()
                          if (item.clearAfterAction !== false) {
                            setQuery("")
                            setSuggestIdx(-1)
                          }
                        }}
                        type="button"
                      >
                        <span class="suggestion-icon">{item.icon}</span>
                        <span class="suggestion-text">
                          <span class="suggestion-name">{item.name}</span>
                          <span class="suggestion-desc">{item.desc}</span>
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
        </div>
      </Show>
    </div>
  )
}

export const officialSearchCommandBar: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.search.command-bar",
    name: "Tabora Search Command Bar",
    version: "0.0.0",
    entry: "./search-command-bar",
    engine: { platform: "^0.1.0" },
    permissions: [{ type: "external-open", hosts: ["*"] }],
    contributes: {
      searches: [
        {
          id: "official.search.command-bar",
          title: "搜索栏",
          defaultProviderIds: ["official.search.google", "official.search.bing"],
          supportsSuggestions: true,
          view: "official.search.command-bar.view",
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.search.command-bar.view", (props: SearchViewProps) =>
      SearchCommandBar({
        ...props,
        openExternal: (url) => context.permissions.openExternal(url),
      }),
    )
  },
}
