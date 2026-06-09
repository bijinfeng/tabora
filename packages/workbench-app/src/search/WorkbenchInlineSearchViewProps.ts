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
  getQuery: () => string
  getIsOpen: () => boolean
  getActiveResultIndex: () => number
  getProviders: () => SearchProviderContribution[]
  getDefaultProviderId: () => string
  getCommands: () => SearchCommandEntry[]
  getWidgets: () => SearchWidgetEntry[]
  getHistory: () => SearchHistoryEntry[]
  setQuery: (query: string) => void
  setOpen: (open: boolean) => void
  setActiveResultIndex: SearchResultIndexSetter
  setDefaultProvider: (providerId: string) => void | Promise<void>
  saveHistory: (entry: { query: string; providerId: string }) => Promise<void>
  openExternal: (pluginId: string, url: string) => boolean
  showToast: (message: string, options?: ToastOptions) => void
}): SearchViewProps {
  function searchSurfaceState() {
    return buildWorkbenchSearchSurfaceState({
      query: options.getQuery(),
      providers: options.getProviders(),
      defaultProviderId: options.getDefaultProviderId(),
      commands: options.getCommands(),
      widgets: options.getWidgets(),
      history: options.getHistory(),
      onProviderTokenSelect: (token) => {
        options.setQuery(`@${token} `)
        options.setActiveResultIndex(-1)
        options.setOpen(true)
      },
      onWebSearch: (provider, query) => {
        void submitInlineSearch(query, provider.id)
      },
    })
  }

  async function submitInlineSearch(searchQuery: string, providerId?: string) {
    const trimmed = searchQuery.trim()
    if (!trimmed) {
      return
    }

    const providers = options.getProviders()
    const defaultProviderId = options.getDefaultProviderId()
    const provider = providerId
      ? providers.find((candidate) => candidate.id === providerId)
      : undefined
    const route = provider ? null : routeSearchQuery(trimmed, providers, defaultProviderId)
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
    get providers() {
      return options.getProviders()
    },
    get defaultProviderId() {
      return options.getDefaultProviderId()
    },
    get activeProviderId() {
      return searchSurfaceState().activeProviderId
    },
    get query() {
      return options.getQuery()
    },
    get providerToken() {
      return searchSurfaceState().providerToken
    },
    get recentSearches() {
      return options.getHistory().map((entry) => entry.query)
    },
    get results() {
      return searchSurfaceState().results
    },
    get activeResultIndex() {
      return options.getActiveResultIndex()
    },
    get isOpen() {
      return options.getIsOpen()
    },
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
      resolveProvider: (keyword) => findProviderByToken(options.getProviders(), keyword) ?? null,
      moveSelection: (direction) => {
        options.setOpen(true)
        const items = searchSurfaceState().items
        options.setActiveResultIndex((currentIndex) =>
          moveWorkbenchSearchSelection(currentIndex, direction, items.length),
        )
      },
      executeSelection: async (resultIndex) => {
        const nextIndex = resultIndex ?? options.getActiveResultIndex()
        const item = searchSurfaceState().items[nextIndex]
        if (item) {
          item.action()
          if (item.closeAfterAction !== false) {
            options.setQuery("")
            options.setActiveResultIndex(-1)
            options.setOpen(false)
          }
          return
        }

        await submitInlineSearch(options.getQuery())
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
