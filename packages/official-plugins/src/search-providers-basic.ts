import type { BuiltinPlugin } from "@tabora/platform-kernel"

export const officialSearchProvidersBasic: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.search-providers.basic",
    name: "Basic Search Providers",
    version: "0.0.0",
    apiVersion: "1.0.0",
    entry: "./search-providers-basic",
    engine: { platform: "^0.1.0" },
    permissions: [{ type: "external-open", hosts: ["*"] }],
    contributes: {
      searchProviders: [
        {
          id: "official.search.google",
          title: "Google",
          urlTemplate: "https://www.google.com/search?q={query}",
          shortcut: "g",
        },
        {
          id: "official.search.bing",
          title: "Bing",
          urlTemplate: "https://www.bing.com/search?q={query}",
          shortcut: "b",
        },
        {
          id: "official.search.baidu",
          title: "百度",
          urlTemplate: "https://www.baidu.com/s?wd={query}",
          shortcut: "d",
        },
        {
          id: "official.search.duckduckgo",
          title: "DuckDuckGo",
          urlTemplate: "https://duckduckgo.com/?q={query}",
          shortcut: "dd",
        },
        {
          id: "official.search.github",
          title: "GitHub",
          urlTemplate: "https://github.com/search?q={query}",
          shortcut: "gh",
        },
      ],
    },
  },
  activate() {},
}
