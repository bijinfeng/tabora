import { createSignal, For, Show } from "solid-js"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { Input, Select, Button } from "@tabora/ui"

const QUICK_TAGS = ["天气", "新闻", "翻译", "计算器", "汇率"]

type ProviderId = "google" | "bing" | "baidu" | "duckduckgo" | "github"

const PROVIDERS: { value: ProviderId; label: string; url: string }[] = [
  { value: "google", label: "Google", url: "https://www.google.com/search?q={query}" },
  { value: "bing", label: "Bing", url: "https://www.bing.com/search?q={query}" },
  { value: "baidu", label: "百度", url: "https://www.baidu.com/s?wd={query}" },
  { value: "duckduckgo", label: "DuckDuckGo", url: "https://duckduckgo.com/?q={query}" },
  { value: "github", label: "GitHub", url: "https://github.com/search?q={query}" },
]
type SearchCommandBarProps = {
  openExternal?: (url: string) => void
}

export function SearchCommandBar(props: SearchCommandBarProps = {}) {
  const [query, setQuery] = createSignal("")
  const [providerId, setProviderId] = createSignal<ProviderId>("google")
  const [focused, setFocused] = createSignal(false)

  function doSearch(q: string) {
    const provider = PROVIDERS.find((p) => p.value === providerId())
    if (!provider) return
    const url = provider.url.replace("{query}", encodeURIComponent(q.trim()))
    props.openExternal?.(url)
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
        <Select<ProviderId>
          value={providerId()}
          options={PROVIDERS.map((p) => ({ value: p.value, label: p.label }))}
          onChange={(v) => setProviderId(v)}
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
    context.registry.views.register(
      "official.search.command-bar.view",
      (props: SearchCommandBarProps = {}) =>
        SearchCommandBar({
          ...props,
          openExternal: (url) => {
            context.permissions.openExternal(url)
          },
        }),
    )
  },
}
