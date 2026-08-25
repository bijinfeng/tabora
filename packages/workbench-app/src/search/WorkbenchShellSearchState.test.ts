import type { SearchHistoryEntry, WorkbenchSearchSettings, Workspace } from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"

import {
  clearWorkbenchSearchHistory,
  saveWorkbenchSearchHistory,
  setWorkbenchDefaultSearchProvider,
  setWorkbenchSearchProviderEnabled,
} from "./WorkbenchShellSearchState"

const provider = (id: string) => ({
  pluginId: "official.search.providers",
  kind: "search-provider" as const,
  id,
})
const providers = ["official.google", "official.duckduckgo"].map((id) => ({
  id,
  ref: provider(id),
}))

function workspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: "workspace-1",
    name: "Default",
    activeLayout: {
      pluginId: "official.layout",
      kind: "layout",
      id: "official.layout.workbench-dashboard",
    },
    activeTheme: { pluginId: "official.theme", kind: "theme", id: "official.theme.light" },
    activeBackgroundProvider: {
      pluginId: "official.background",
      kind: "background-provider",
      id: "official.background.default",
    },
    createdAt: "2026-06-06T00:00:00.000Z",
    updatedAt: "2026-06-06T00:00:00.000Z",
    ...overrides,
  }
}

describe("setWorkbenchDefaultSearchProvider", () => {
  it("persists the default provider into workspace config and local search settings", async () => {
    let currentWorkspace = workspace()
    let currentSettings: WorkbenchSearchSettings = {
      defaultProvider: provider("official.google"),
      enabledProviders: [provider("official.google"), provider("official.duckduckgo")],
    }

    await setWorkbenchDefaultSearchProvider({
      provider: provider("official.duckduckgo"),
      providers,
      updateWorkspace: async (mutator) => {
        currentWorkspace = mutator(currentWorkspace)
      },
      setSearchSettings: (updater) => {
        currentSettings = updater(currentSettings)
      },
      warn: vi.fn(),
    })

    const persistedSettings = currentWorkspace.config?.search as WorkbenchSearchSettings | undefined
    if (!persistedSettings) throw new Error("Expected persisted search settings")
    expect(persistedSettings.defaultProvider.id).toBe("official.duckduckgo")
    expect(currentSettings.defaultProvider.id).toBe("official.duckduckgo")
  })

  it("warns and skips updates when the provider id is unknown", async () => {
    const warn = vi.fn()
    const updateWorkspace = vi.fn(async () => {})
    const setSearchSettings = vi.fn()

    await setWorkbenchDefaultSearchProvider({
      provider: provider("missing"),
      providers: [providers[0]!],
      updateWorkspace,
      setSearchSettings,
      warn,
    })

    expect(warn).toHaveBeenCalledWith('Unknown search provider: "missing"')
    expect(updateWorkspace).not.toHaveBeenCalled()
    expect(setSearchSettings).not.toHaveBeenCalled()
  })
})

describe("setWorkbenchSearchProviderEnabled", () => {
  it("persists the enabled provider ids into workspace config and local search settings", async () => {
    let currentWorkspace = workspace({
      config: {
        search: {
          defaultProvider: provider("official.google"),
          enabledProviders: [provider("official.google"), provider("official.duckduckgo")],
        },
      },
    })
    let currentSettings: WorkbenchSearchSettings = {
      defaultProvider: provider("official.google"),
      enabledProviders: [provider("official.google"), provider("official.duckduckgo")],
    }

    await setWorkbenchSearchProviderEnabled({
      provider: provider("official.duckduckgo"),
      enabled: false,
      currentSettings,
      providers,
      updateWorkspace: async (mutator) => {
        currentWorkspace = mutator(currentWorkspace)
      },
      setSearchSettings: (updater) => {
        currentSettings = updater(currentSettings)
      },
      warn: vi.fn(),
    })

    const persistedSettings = currentWorkspace.config?.search as WorkbenchSearchSettings | undefined
    if (!persistedSettings) throw new Error("Expected persisted search settings")
    expect(persistedSettings.enabledProviders.map((item) => item.id)).toEqual(["official.google"])
    expect(currentSettings.enabledProviders.map((item) => item.id)).toEqual(["official.google"])
  })

  it("warns and skips updates when disabling the current default provider", async () => {
    const warn = vi.fn()
    const updateWorkspace = vi.fn(async () => {})
    const setSearchSettings = vi.fn()

    await setWorkbenchSearchProviderEnabled({
      provider: provider("official.google"),
      enabled: false,
      currentSettings: {
        defaultProvider: provider("official.google"),
        enabledProviders: [provider("official.google"), provider("official.duckduckgo")],
      },
      providers,
      updateWorkspace,
      setSearchSettings,
      warn,
    })

    expect(warn).toHaveBeenCalledWith(
      'Cannot disable the default search provider: "official.google"',
    )
    expect(updateWorkspace).not.toHaveBeenCalled()
    expect(setSearchSettings).not.toHaveBeenCalled()
  })
})

describe("search history helpers", () => {
  it("deduplicates recent identical search history before persisting", async () => {
    const previousHistory: SearchHistoryEntry[] = [
      {
        query: "tabora",
        providerId: "official.google",
        timestamp: "2026-06-06T01:00:00.000Z",
      },
      {
        query: "older",
        providerId: "official.google",
        timestamp: "2026-06-06T00:40:00.000Z",
      },
    ]
    let currentHistory = previousHistory
    const saveForWorkspace = vi.fn(async () => {})

    await saveWorkbenchSearchHistory({
      workspaceId: "workspace-1",
      history: previousHistory,
      entry: { query: "tabora", providerId: "official.google" },
      now: "2026-06-06T01:03:00.000Z",
      storage: {
        pluginId: "search.plugin.custom",
        key: "search-history-custom",
      },
      setSearchHistory: (history) => {
        currentHistory = history
      },
      saveForWorkspace,
    })

    expect(currentHistory).toEqual([
      {
        query: "older",
        providerId: "official.google",
        timestamp: "2026-06-06T00:40:00.000Z",
      },
      {
        query: "tabora",
        providerId: "official.google",
        timestamp: "2026-06-06T01:03:00.000Z",
      },
    ])
    expect(saveForWorkspace).toHaveBeenCalledWith(
      "search.plugin.custom",
      "workspace-1",
      "search-history-custom",
      currentHistory,
    )
  })

  it("clears persisted workspace search history", async () => {
    let currentHistory: SearchHistoryEntry[] = [
      {
        query: "tabora",
        providerId: "official.google",
        timestamp: "2026-06-06T01:00:00.000Z",
      },
    ]
    const saveForWorkspace = vi.fn(async () => {})

    await clearWorkbenchSearchHistory({
      workspaceId: "workspace-1",
      storage: {
        pluginId: "search.plugin.custom",
        key: "search-history-custom",
      },
      setSearchHistory: (history) => {
        currentHistory = history
      },
      saveForWorkspace,
    })

    expect(currentHistory).toEqual([])
    expect(saveForWorkspace).toHaveBeenCalledWith(
      "search.plugin.custom",
      "workspace-1",
      "search-history-custom",
      [],
    )
  })
})
