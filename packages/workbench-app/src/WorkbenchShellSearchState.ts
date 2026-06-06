import type {
  SearchHistoryEntry,
  SearchProviderContribution,
  WorkbenchSearchSettings,
  Workspace,
} from "@tabora/plugin-api"

type SearchProviderSummary = Pick<SearchProviderContribution, "id">

type UpdateWorkspace = (mutator: (workspace: Workspace) => Workspace) => Promise<void>
type SearchSettingsUpdater = (
  updater: (previous: WorkbenchSearchSettings) => WorkbenchSearchSettings,
) => void
type SearchHistorySetter = (history: SearchHistoryEntry[]) => void
type WorkspaceSearchDataSaver = (
  pluginId: string,
  workspaceId: string,
  key: string,
  value: SearchHistoryEntry[],
) => Promise<void>

export function resolveWorkbenchEnabledProviderIds(
  settings: WorkbenchSearchSettings,
  providers: SearchProviderSummary[],
): string[] {
  return settings.enabledProviderIds ?? providers.map((provider) => provider.id)
}

export async function setWorkbenchDefaultSearchProvider(options: {
  providerId: string
  providers: SearchProviderSummary[]
  updateWorkspace: UpdateWorkspace
  setSearchSettings: SearchSettingsUpdater
  warn: (message: string) => void
}) {
  if (!options.providers.some((provider) => provider.id === options.providerId)) {
    options.warn(`Unknown search provider: "${options.providerId}"`)
    return
  }

  await options.updateWorkspace((workspace) => {
    const currentSearch = (workspace.config?.search as Record<string, unknown>) ?? {}
    workspace.config = {
      ...(workspace.config ?? {}),
      search: { ...currentSearch, defaultProviderId: options.providerId },
    }
    return workspace
  })

  options.setSearchSettings((previous) => ({
    ...previous,
    defaultProviderId: options.providerId,
  }))
}

export async function setWorkbenchSearchProviderEnabled(options: {
  providerId: string
  enabled: boolean
  providers: SearchProviderSummary[]
  updateWorkspace: UpdateWorkspace
  setSearchSettings: SearchSettingsUpdater
  warn: (message: string) => void
}) {
  if (!options.providers.some((provider) => provider.id === options.providerId)) {
    options.warn(`Unknown search provider: "${options.providerId}"`)
    return
  }

  await options.updateWorkspace((workspace) => {
    const currentSearch = (workspace.config?.search as Record<string, unknown>) ?? {}
    const currentEnabled = (
      Array.isArray(currentSearch.enabledProviderIds)
        ? currentSearch.enabledProviderIds
        : options.providers.map((provider) => provider.id)
    ) as string[]
    const nextEnabled = options.enabled
      ? [...new Set([...currentEnabled, options.providerId])]
      : currentEnabled.filter((id) => id !== options.providerId)
    workspace.config = {
      ...(workspace.config ?? {}),
      search: { ...currentSearch, enabledProviderIds: nextEnabled },
    }
    return workspace
  })

  options.setSearchSettings((previous) => {
    const currentEnabled = resolveWorkbenchEnabledProviderIds(previous, options.providers)
    const nextEnabled = options.enabled
      ? [...new Set([...currentEnabled, options.providerId])]
      : currentEnabled.filter((id) => id !== options.providerId)
    return {
      ...previous,
      enabledProviderIds: nextEnabled,
    }
  })
}

export async function saveWorkbenchSearchHistory(options: {
  workspaceId: string
  history: SearchHistoryEntry[]
  entry: { query: string; providerId: string }
  now?: string
  setSearchHistory: SearchHistorySetter
  saveForWorkspace: WorkspaceSearchDataSaver
}) {
  const currentTimestamp = options.now ?? new Date().toISOString()
  const fiveMinutesAgo = new Date(currentTimestamp).getTime() - 5 * 60 * 1000
  const nextHistory: SearchHistoryEntry[] = [
    ...options.history.filter(
      (historyEntry) =>
        !(
          historyEntry.query === options.entry.query &&
          historyEntry.providerId === options.entry.providerId &&
          new Date(historyEntry.timestamp).getTime() > fiveMinutesAgo
        ),
    ),
    { ...options.entry, timestamp: currentTimestamp },
  ]

  options.setSearchHistory(nextHistory)
  await options.saveForWorkspace(
    "official.search.command-bar",
    options.workspaceId,
    "search-history",
    nextHistory,
  )
}

export async function clearWorkbenchSearchHistory(options: {
  workspaceId: string
  setSearchHistory: SearchHistorySetter
  saveForWorkspace: WorkspaceSearchDataSaver
}) {
  options.setSearchHistory([])
  await options.saveForWorkspace(
    "official.search.command-bar",
    options.workspaceId,
    "search-history",
    [],
  )
}
