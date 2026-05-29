import { createMemo, createSignal, For, Show } from "solid-js"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import type { SearchProviderContribution, SearchViewProps } from "@tabora/plugin-api"
import { Input, Select, Button } from "@tabora/ui"

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

export function SearchCommandBar(props: SearchViewProps) {
  const providers = createMemo(() =>
    props.providers.length > 0 ? props.providers : [FALLBACK_PROVIDER],
  )
  const [providerId, setProviderId] = createSignal(props.defaultProviderId || providers()[0]!.id)
  const [query, setQuery] = createSignal("")
  const [focused, setFocused] = createSignal(false)

  const activeProvider = createMemo(() => {
    const match = providers().find((p) => p.id === providerId())
    return match ?? providers()[0]!
  })

  function doSearch(q: string) {
    const url = buildSearchUrl(activeProvider(), q)
    props.openExternal?.(url)
  }

  function handleProviderChange(nextProviderId: string) {
    setProviderId(nextProviderId)
    safelyHandleProviderChange(props.onDefaultProviderChange, nextProviderId)
  }

  function handleSubmit(event: Event) {
    event.preventDefault()
    const q = query().trim()
    if (!q) return
    doSearch(q)
    setQuery("")
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault()
      const q = query().trim()
      if (q) {
        doSearch(q)
        setQuery("")
      }
    }
  }

  function handleTagClick(tag: string) {
    setQuery(tag)
    doSearch(tag)
  }

  const showSuggestions = () => focused() && query().length === 0
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
          placeholder="输入搜索内容"
          aria-label="搜索内容"
          type="search"
        />
        <Button type="submit" variant="primary" size="sm">
          搜索
        </Button>
      </form>
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
        openExternal: (url) => {
          context.permissions.openExternal(url)
        },
      }),
    )
  },
}
