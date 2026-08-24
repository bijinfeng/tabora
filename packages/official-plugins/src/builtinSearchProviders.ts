import type { SearchProviderContribution } from "@tabora/plugin-api/sdk"

/**
 * Builtin search providers are owned by the discovered search command-bar plugin, which
 * holds the `external-open` permission used to launch web searches. Attributing them to
 * that plugin (instead of a synthetic id) lets the host permission bridge authorize the
 * external open, while keeping settings refs resolvable through the host builtin catalog.
 */
export const BUILTIN_SEARCH_PROVIDER_PLUGIN_ID = "official.search.command-bar"

export const builtinSearchProviders: SearchProviderContribution[] = [
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
]
