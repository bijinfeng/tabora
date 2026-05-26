import type { BuiltinPlugin } from "@tabora/platform-kernel"

export function SearchCommandBar() {
  const providers = [
    { id: "google", title: "Google", url: "https://www.google.com/search?q={query}" },
    { id: "bing", title: "Bing", url: "https://www.bing.com/search?q={query}" },
    { id: "baidu", title: "百度", url: "https://www.baidu.com/s?wd={query}" },
    { id: "duckduckgo", title: "DuckDuckGo", url: "https://duckduckgo.com/?q={query}" },
    { id: "github", title: "GitHub", url: "https://github.com/search?q={query}" },
  ]

  function handleSubmit(event: Event) {
    event.preventDefault()
    const form = event.currentTarget as HTMLFormElement
    const input = form.querySelector(".search-input") as HTMLInputElement
    const select = form.querySelector(".search-provider") as HTMLSelectElement
    const query = input.value.trim()
    if (!query) return
    const provider = providers[select.selectedIndex]
    if (!provider) return
    const url = provider.url.replace("{query}", encodeURIComponent(query))
    window.open(url, "_blank")
  }

  return (
    <form class="search-bar" onSubmit={handleSubmit}>
      <select aria-label="搜索源" class="search-provider">
        {providers.map((p) => (
          <option value={p.id}>{p.title}</option>
        ))}
      </select>
      <input class="search-input" placeholder="输入搜索内容" aria-label="搜索内容" />
    </form>
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
          supportsSuggestions: false,
          view: "official.search.command-bar.view",
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.search.command-bar.view", SearchCommandBar)
  },
}
