import { createSignal, For, Show } from "solid-js"
import type { BuiltinPlugin } from "@tabora/platform-kernel"

const QUICK_TAGS = ["天气", "新闻", "翻译", "计算器", "汇率"]

export function SearchCommandBar() {
  const providers = [
    { id: "google", title: "Google", url: "https://www.google.com/search?q={query}" },
    { id: "bing", title: "Bing", url: "https://www.bing.com/search?q={query}" },
    { id: "baidu", title: "百度", url: "https://www.baidu.com/s?wd={query}" },
    { id: "duckduckgo", title: "DuckDuckGo", url: "https://duckduckgo.com/?q={query}" },
    { id: "github", title: "GitHub", url: "https://github.com/search?q={query}" },
  ]

  const [query, setQuery] = createSignal("")
  const [focused, setFocused] = createSignal(false)

  function doSearch(q: string) {
    const provider = providers[0]
    if (!provider) return
    const url = provider.url.replace("{query}", encodeURIComponent(q.trim()))
    window.open(url, "_blank")
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
        <select aria-label="搜索源" class="search-provider">
          <For each={providers}>{(p) => <option value={p.id}>{p.title}</option>}</For>
        </select>
        <input
          class="search-input"
          placeholder="输入搜索内容"
          aria-label="搜索内容"
          value={query()}
          onInput={(e) => setQuery(e.currentTarget.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
        />
      </form>
      <Show when={showSuggestions()}>
        <div class="search-suggestions">
          <span class="suggestions-label">快捷搜索：</span>
          <For each={QUICK_TAGS}>
            {(tag) => (
              <button class="suggestion-tag" onClick={() => handleTagClick(tag)} type="button">
                {tag}
              </button>
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
    context.registry.views.register("official.search.command-bar.view", SearchCommandBar)
  },
}
