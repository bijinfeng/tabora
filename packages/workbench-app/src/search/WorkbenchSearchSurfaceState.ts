import type {
  SearchCommandEntry,
  SearchHistoryEntry,
  SearchProviderContribution,
  SearchResultGroup,
  SearchWidgetEntry,
} from "@tabora/plugin-api"
import {
  createCommandPaletteItems,
  routeSearchQuery,
  type CommandPaletteItem,
} from "@tabora/orchestrator"

export type WorkbenchSearchSurfaceState = {
  activeProviderId: string
  providerToken: string | null
  results: SearchResultGroup[]
  items: CommandPaletteItem[]
}

export function buildWorkbenchSearchSurfaceState<
  TProvider extends SearchProviderContribution,
>(options: {
  query: string
  providers: TProvider[]
  defaultProviderId: string
  commands: SearchCommandEntry[]
  widgets: SearchWidgetEntry[]
  history: SearchHistoryEntry[]
  onProviderTokenSelect: (token: string) => void
  onWebSearch: (provider: TProvider, query: string) => void
}): WorkbenchSearchSurfaceState {
  const items = createCommandPaletteItems({
    surface: "inline",
    query: options.query,
    commands: options.commands,
    widgets: options.widgets,
    providers: options.providers,
    defaultProviderId: options.defaultProviderId,
    history: options.history,
    onProviderTokenSelect: options.onProviderTokenSelect,
    onWebSearch: options.onWebSearch,
  })

  const route = routeSearchQuery(options.query, options.providers, options.defaultProviderId)
  const providerToken =
    route?.type === "provider-pending" || route?.type === "provider" ? route.token : null

  return {
    activeProviderId: options.defaultProviderId,
    providerToken,
    results: groupSearchResultItems(items),
    items,
  }
}

export function moveWorkbenchSearchSelection(
  currentIndex: number,
  direction: "next" | "prev",
  total: number,
): number {
  if (total <= 0) {
    return -1
  }

  if (direction === "next") {
    return Math.min(currentIndex + 1, total - 1)
  }

  return Math.max(currentIndex - 1, 0)
}

function groupSearchResultItems(items: CommandPaletteItem[]): SearchResultGroup[] {
  const groups = new Map<string, SearchResultGroup>()

  for (const item of items) {
    const group = groups.get(item.group) ?? {
      id: item.group,
      label: item.group,
      items: [],
    }
    group.items.push({
      id: item.id,
      icon: item.icon,
      name: item.name,
      desc: item.desc,
      ...(item.hint ? { hint: item.hint } : {}),
    })
    groups.set(item.group, group)
  }

  return [...groups.values()]
}
