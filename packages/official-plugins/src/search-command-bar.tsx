import type { BuiltinPlugin } from "@tabora/platform-kernel"

export function SearchCommandBar() {
  return (
    <form class="search-bar" onSubmit={(event) => event.preventDefault()}>
      <select aria-label="搜索源" class="search-provider">
        <option>Google</option>
        <option>Bing</option>
        <option>百度</option>
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
