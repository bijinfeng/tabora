import { createMemo, createSignal, For, Show } from "solid-js"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import type { SearchProviderContribution, SearchViewProps } from "@tabora/plugin-api"
import { Button, Input, InlineError, Select } from "@tabora/ui"

const QUICK_TAGS = ["天气", "新闻", "翻译", "计算器", "汇率"]

const FALLBACK_PROVIDER: SearchProviderContribution = {
  id: "official.search.google",
  title: "Google",
  urlTemplate: "https://www.google.com/search?q={query}",
  shortcut: "g",
}

function providerOptions(providers: SearchProviderContribution[]) {
  return providers.map((p) => ({ value: p.id, label: p.title }))
}

export function safelyHandleProviderChange(
  onChange: ((id: string) => void | Promise<void>) | undefined,
  nextProviderId: string,
): void {
  const result = onChange?.(nextProviderId)
  if (result instanceof Promise) {
    result.catch((err) => {
      console.warn("Failed to change default provider:", err)
    })
  }
}

export function buildSearchUrl(provider: SearchProviderContribution, query: string): string {
  return provider.urlTemplate.replaceAll("{query}", encodeURIComponent(query.trim()))
}

function resolveShortcut(
  query: string,
  providers: SearchProviderContribution[],
): { provider: SearchProviderContribution; searchQuery: string } | null {
  const trimmed = query.trim()
  const spaceIndex = trimmed.indexOf(" ")
  if (spaceIndex <= 0) return null

  const shortcut = trimmed.slice(0, spaceIndex)
  const provider = providers.find(
    (p) => p.shortcut && p.shortcut.toLowerCase() === shortcut.toLowerCase(),
  )
  if (!provider) return null

  return { provider, searchQuery: trimmed.slice(spaceIndex + 1).trim() }
}

export function SearchCommandBar(props: SearchViewProps) {
  const providers = createMemo(() =>
    props.providers.length > 0 ? props.providers : [FALLBACK_PROVIDER],
  )
  const [providerId, setProviderId] = createSignal(props.defaultProviderId || providers()[0]!.id)
  const [query, setQuery] = createSignal("")
  const [focused, setFocused] = createSignal(false)
  const [permissionDenied, setPermissionDenied] = createSignal(false)
  const [showHistory, setShowHistory] = createSignal(false)

  const activeProvider = createMemo(() => {
    const match = providers().find((p) => p.id === providerId())
    return match ?? providers()[0]!
  })

  function doSearch(q: string, targetProvider?: SearchProviderContribution) {
    setPermissionDenied(false)
    setShowHistory(false)
    const provider = targetProvider ?? activeProvider()
    const url = buildSearchUrl(provider, q)
    const opened = props.openExternal?.(url)
    if (!opened) {
      setPermissionDenied(true)
      return
    }
    void props.onSaveHistory?.({ query: q, providerId: provider.id })
  }

  function handleSubmit(event: Event) {
    event.preventDefault()
    const q = query().trim()
    if (!q) return

    const resolved = resolveShortcut(q, providers())
    if (resolved) {
      doSearch(resolved.searchQuery, resolved.provider)
    } else {
      doSearch(q)
    }
    setQuery("")
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      const q = query().trim()
      if (q) {
        const resolved = resolveShortcut(q, providers())
        if (resolved) {
          doSearch(resolved.searchQuery, resolved.provider)
        } else {
          doSearch(q)
        }
        setQuery("")
      }
    }
  }

  function handleProviderChange(nextProviderId: string) {
    setProviderId(nextProviderId)
    safelyHandleProviderChange(props.onDefaultProviderChange, nextProviderId)
  }

  function handleTagClick(tag: string) {
    setQuery(tag)
    doSearch(tag)
  }

  function handleHistoryClick(entry: { query: string; providerId: string }) {
    const provider = providers().find((p) => p.id === entry.providerId)
    if (provider) {
      setProviderId(provider.id)
    }
    doSearch(entry.query, provider)
  }

  const recentHistory = createMemo(() => {
    return (props.searchHistory ?? []).slice(0, 8).reverse()
  })

  const showSuggestions = () => focused() && query().length === 0 && !showHistory()

  return (
    <div class="search-wrapper">
      <form class="search-bar" onSubmit={handleSubmit}>
        <Select<string>
          value={activeProvider().id}
          options={providerOptions(providers())}
          onChange={(v) => handleProviderChange(v)}
          aria-label="搜索源"
          size="sm"
        />
        <Input
          value={query()}
          onInput={setQuery}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          placeholder="输入搜索内容（用 gh 搜索词 切换搜索源）"
          aria-label="搜索内容"
          type="search"
        />
        <Button type="submit" variant="primary" size="sm">
          搜索
        </Button>
      </form>
      <Show when={permissionDenied()}>
        <InlineError>外部打开被拒绝，请检查权限设置</InlineError>
      </Show>
      <Show when={showSuggestions()}>
        <div class="search-suggestions">
          <span class="suggestions-label">快捷搜索：</span>
          <For each={QUICK_TAGS}>
            {(tag) => (
              <Button variant="ghost" size="sm" onClick={() => handleTagClick(tag)}>
                {tag}
              </Button>
            )}
          </For>
          <Show when={recentHistory().length > 0}>
            <button
              class="search-history-toggle"
              onClick={() => setShowHistory(true)}
              type="button"
            >
              历史
            </button>
          </Show>
        </div>
      </Show>
      <Show when={showHistory()}>
        <div class="search-history-panel">
          <div class="search-history-header">
            <span class="suggestions-label">最近搜索</span>
            <Show when={recentHistory().length > 0}>
              <button
                class="search-history-clear"
                onClick={() => void props.onClearHistory?.()}
                type="button"
              >
                清空
              </button>
            </Show>
          </div>
          <Show
            when={recentHistory().length > 0}
            fallback={<div class="search-history-empty">暂无历史记录</div>}
          >
            <ul class="search-history-list">
              <For each={recentHistory()}>
                {(entry) => {
                  const provider = providers().find((p) => p.id === entry.providerId)
                  return (
                    <li>
                      <button
                        class="search-history-item"
                        onClick={() => handleHistoryClick(entry)}
                        type="button"
                      >
                        <span class="search-history-query">{entry.query}</span>
                        <span class="search-history-provider">
                          {provider?.title ?? entry.providerId}
                        </span>
                      </button>
                    </li>
                  )
                }}
              </For>
            </ul>
          </Show>
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
