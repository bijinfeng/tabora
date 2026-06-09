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
type SearchHistoryStorage = {
  pluginId: string
  key: string
}
type WorkspaceSearchDataSaver = (
  pluginId: string,
  workspaceId: string,
  key: string,
  value: SearchHistoryEntry[],
) => Promise<void>

export function resolveWorkbenchEnabledProviderIds(settings: WorkbenchSearchSettings): string[] {
  return settings.enabledProviderIds
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
  currentSettings: WorkbenchSearchSettings
  providers: SearchProviderSummary[]
  updateWorkspace: UpdateWorkspace
  setSearchSettings: SearchSettingsUpdater
  warn: (message: string) => void
}) {
  if (!options.providers.some((provider) => provider.id === options.providerId)) {
    options.warn(`Unknown search provider: "${options.providerId}"`)
    return
  }

  const currentEnabled = resolveWorkbenchEnabledProviderIds(options.currentSettings)

  if (!options.enabled && options.currentSettings.defaultProviderId === options.providerId) {
    options.warn(`Cannot disable the default search provider: "${options.providerId}"`)
    return
  }

  const nextEnabled = options.enabled
    ? [...new Set([...currentEnabled, options.providerId])]
    : currentEnabled.filter((id) => id !== options.providerId)

  await options.updateWorkspace((workspace) => {
    const currentSearch = workspace.config?.search as WorkbenchSearchSettings
    workspace.config = {
      ...(workspace.config ?? {}),
      search: { ...currentSearch, enabledProviderIds: nextEnabled },
    }
    return workspace
  })

  options.setSearchSettings((previous) => {
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
  storage: SearchHistoryStorage
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
    options.storage.pluginId,
    options.workspaceId,
    options.storage.key,
    nextHistory,
  )
}

export async function clearWorkbenchSearchHistory(options: {
  workspaceId: string
  storage: SearchHistoryStorage
  setSearchHistory: SearchHistorySetter
  saveForWorkspace: WorkspaceSearchDataSaver
}) {
  options.setSearchHistory([])
  await options.saveForWorkspace(
    options.storage.pluginId,
    options.workspaceId,
    options.storage.key,
    [],
  )
}
