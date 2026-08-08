import type {
  SearchProviderContributionRef,
  SearchHistoryEntry,
  SearchProviderContribution,
  WorkbenchSearchSettings,
  Workspace,
} from "@tabora/plugin-api"
import { sameContributionRef } from "@tabora/plugin-api"

type SearchProviderSummary = Pick<SearchProviderContribution, "id"> & {
  ref: SearchProviderContributionRef
}

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

export async function setWorkbenchDefaultSearchProvider(options: {
  provider: SearchProviderContributionRef
  providers: SearchProviderSummary[]
  updateWorkspace: UpdateWorkspace
  setSearchSettings: SearchSettingsUpdater
  warn: (message: string) => void
}) {
  if (!options.providers.some((provider) => sameContributionRef(provider.ref, options.provider))) {
    options.warn(`Unknown search provider: "${options.provider.id}"`)
    return
  }

  await options.updateWorkspace((workspace) => {
    const currentSearch = (workspace.config?.search as Record<string, unknown>) ?? {}
    workspace.config = {
      ...(workspace.config ?? {}),
      search: { ...currentSearch, defaultProvider: options.provider },
    }
    return workspace
  })

  options.setSearchSettings((previous) => ({
    ...previous,
    defaultProvider: options.provider,
  }))
}

export async function setWorkbenchSearchProviderEnabled(options: {
  provider: SearchProviderContributionRef
  enabled: boolean
  currentSettings: WorkbenchSearchSettings
  providers: SearchProviderSummary[]
  updateWorkspace: UpdateWorkspace
  setSearchSettings: SearchSettingsUpdater
  warn: (message: string) => void
}) {
  if (!options.providers.some((item) => sameContributionRef(item.ref, options.provider))) {
    options.warn(`Unknown search provider: "${options.provider.id}"`)
    return
  }

  if (
    !options.enabled &&
    sameContributionRef(options.currentSettings.defaultProvider, options.provider)
  ) {
    options.warn(`Cannot disable the default search provider: "${options.provider.id}"`)
    return
  }

  const nextEnabled = options.enabled
    ? options.currentSettings.enabledProviders.some((item) =>
        sameContributionRef(item, options.provider),
      )
      ? options.currentSettings.enabledProviders
      : [...options.currentSettings.enabledProviders, options.provider]
    : options.currentSettings.enabledProviders.filter(
        (item) => !sameContributionRef(item, options.provider),
      )

  await options.updateWorkspace((workspace) => {
    const currentSearch = workspace.config?.search as WorkbenchSearchSettings
    workspace.config = {
      ...(workspace.config ?? {}),
      search: { ...currentSearch, enabledProviders: nextEnabled },
    }
    return workspace
  })

  options.setSearchSettings((previous) => {
    return {
      ...previous,
      enabledProviders: nextEnabled,
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
