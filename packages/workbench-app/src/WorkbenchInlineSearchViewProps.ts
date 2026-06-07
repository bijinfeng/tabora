import type {
  SearchCommandEntry,
  SearchHistoryEntry,
  SearchProviderContribution,
  SearchViewProps,
  SearchWidgetEntry,
} from "@tabora/plugin-api"
import {
  buildSearchUrl,
  findProviderByToken,
  routeSearchQuery,
  type ToastOptions,
} from "@tabora/orchestrator"

import {
  buildWorkbenchSearchSurfaceState,
  moveWorkbenchSearchSelection,
} from "./WorkbenchSearchSurfaceState"

type SearchResultIndexSetter = (next: number | ((current: number) => number)) => void

export function buildWorkbenchInlineSearchViewProps(options: {
  pluginId: string
  query: string
  isOpen: boolean
  activeResultIndex: number
  providers: SearchProviderContribution[]
  defaultProviderId: string
  commands: SearchCommandEntry[]
  widgets: SearchWidgetEntry[]
  history: SearchHistoryEntry[]
  setQuery: (query: string) => void
  setOpen: (open: boolean) => void
  setActiveResultIndex: SearchResultIndexSetter
  setDefaultProvider: (providerId: string) => void | Promise<void>
  saveHistory: (entry: { query: string; providerId: string }) => Promise<void>
  openExternal: (pluginId: string, url: string) => boolean
  showToast: (message: string, options?: ToastOptions) => void
}): SearchViewProps {
  const searchSurfaceState = buildWorkbenchSearchSurfaceState({
    query: options.query,
    providers: options.providers,
    defaultProviderId: options.defaultProviderId,
    commands: options.commands,
    widgets: options.widgets,
    history: options.history,
    onProviderTokenSelect: (token) => {
      options.setQuery(`@${token} `)
      options.setActiveResultIndex(-1)
      options.setOpen(true)
    },
    onWebSearch: (provider, query) => {
      void submitInlineSearch(query, provider.id)
    },
  })

  async function submitInlineSearch(searchQuery: string, providerId?: string) {
    const trimmed = searchQuery.trim()
    if (!trimmed) {
      return
    }

    const provider = providerId
      ? options.providers.find((candidate) => candidate.id === providerId)
      : undefined
    const route = provider
      ? null
      : routeSearchQuery(trimmed, options.providers, options.defaultProviderId)
    const targetProvider =
      provider ?? (route?.type === "provider" || route?.type === "web" ? route.provider : undefined)
    const targetQuery = providerId
      ? trimmed
      : route?.type === "provider" || route?.type === "web"
        ? route.query
        : ""

    if (!targetProvider || !targetQuery) {
      return
    }

    const opened = options.openExternal(
      options.pluginId,
      buildSearchUrl(targetProvider, targetQuery),
    )
    if (!opened) {
      options.showToast("无法打开该搜索源，请检查插件权限", { type: "error" })
      return
    }

    await options.saveHistory({ query: targetQuery, providerId: targetProvider.id })
    options.setQuery("")
    options.setActiveResultIndex(-1)
    options.setOpen(false)
  }

  return {
    entry: "inline",
    providers: options.providers,
    defaultProviderId: options.defaultProviderId,
    activeProviderId: searchSurfaceState.activeProviderId,
    query: options.query,
    providerToken: searchSurfaceState.providerToken,
    recentSearches: options.history.map((entry) => entry.query),
    results: searchSurfaceState.results,
    activeResultIndex: options.activeResultIndex,
    isOpen: options.isOpen,
    host: {
      setQuery: (query) => {
        options.setQuery(query)
        options.setActiveResultIndex(-1)
      },
      submit: async (query, providerId) => {
        await submitInlineSearch(query, providerId)
      },
      setActiveProvider: (providerId) => {
        void options.setDefaultProvider(providerId)
      },
      resolveProvider: (keyword) => findProviderByToken(options.providers, keyword) ?? null,
      moveSelection: (direction) => {
        options.setOpen(true)
        options.setActiveResultIndex((currentIndex) =>
          moveWorkbenchSearchSelection(currentIndex, direction, searchSurfaceState.items.length),
        )
      },
      executeSelection: async (resultIndex) => {
        const nextIndex = resultIndex ?? options.activeResultIndex
        const item = searchSurfaceState.items[nextIndex]
        if (item) {
          item.action()
          if (item.closeAfterAction !== false) {
            options.setQuery("")
            options.setActiveResultIndex(-1)
            options.setOpen(false)
          }
          return
        }

        await submitInlineSearch(options.query)
      },
      open: () => {
        options.setOpen(true)
      },
      close: () => {
        options.setOpen(false)
        options.setActiveResultIndex(-1)
      },
      showToast: (message) => options.showToast(message),
    },
  }
}
