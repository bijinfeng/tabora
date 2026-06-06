import type { SearchHistoryEntry, WorkbenchSearchSettings, Workspace } from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"

import {
  clearWorkbenchSearchHistory,
  resolveWorkbenchEnabledProviderIds,
  saveWorkbenchSearchHistory,
  setWorkbenchDefaultSearchProvider,
  setWorkbenchSearchProviderEnabled,
} from "./WorkbenchShellSearchState"

function workspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: "workspace-1",
    name: "Default",
    activeLayoutId: "official.layout.workbench-dashboard",
    activeThemeId: "official.theme.light",
    activeBackgroundProviderId: "official.background.default",
    regions: {},
    createdAt: "2026-06-06T00:00:00.000Z",
    updatedAt: "2026-06-06T00:00:00.000Z",
    ...overrides,
  }
}

describe("resolveWorkbenchEnabledProviderIds", () => {
  it("falls back to all provider ids when settings omit enabled providers", () => {
    expect(
      resolveWorkbenchEnabledProviderIds({ defaultProviderId: "" }, [
        { id: "official.google" },
        { id: "official.duckduckgo" },
      ]),
    ).toEqual(["official.google", "official.duckduckgo"])
  })
})

describe("setWorkbenchDefaultSearchProvider", () => {
  it("persists the default provider into workspace config and local search settings", async () => {
    const providers = [{ id: "official.google" }, { id: "official.duckduckgo" }]
    let currentWorkspace = workspace()
    let currentSettings: WorkbenchSearchSettings = { defaultProviderId: "" }

    await setWorkbenchDefaultSearchProvider({
      providerId: "official.duckduckgo",
      providers,
      updateWorkspace: async (mutator) => {
        currentWorkspace = mutator(currentWorkspace)
      },
      setSearchSettings: (updater) => {
        currentSettings = updater(currentSettings)
      },
      warn: vi.fn(),
    })

    expect((currentWorkspace.config?.search as Record<string, unknown>)?.defaultProviderId).toBe(
      "official.duckduckgo",
    )
    expect(currentSettings.defaultProviderId).toBe("official.duckduckgo")
  })

  it("warns and skips updates when the provider id is unknown", async () => {
    const warn = vi.fn()
    const updateWorkspace = vi.fn(async () => {})
    const setSearchSettings = vi.fn()

    await setWorkbenchDefaultSearchProvider({
      providerId: "missing",
      providers: [{ id: "official.google" }],
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
    const providers = [{ id: "official.google" }, { id: "official.duckduckgo" }]
    let currentWorkspace = workspace({
      config: { search: { enabledProviderIds: ["official.google", "official.duckduckgo"] } },
    })
    let currentSettings: WorkbenchSearchSettings = {
      defaultProviderId: "official.google",
      enabledProviderIds: ["official.google", "official.duckduckgo"],
    }

    await setWorkbenchSearchProviderEnabled({
      providerId: "official.duckduckgo",
      enabled: false,
      providers,
      updateWorkspace: async (mutator) => {
        currentWorkspace = mutator(currentWorkspace)
      },
      setSearchSettings: (updater) => {
        currentSettings = updater(currentSettings)
      },
      warn: vi.fn(),
    })

    expect(
      (currentWorkspace.config?.search as Record<string, unknown>)?.enabledProviderIds,
    ).toEqual(["official.google"])
    expect(currentSettings.enabledProviderIds).toEqual(["official.google"])
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
      "official.search.command-bar",
      "workspace-1",
      "search-history",
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
      setSearchHistory: (history) => {
        currentHistory = history
      },
      saveForWorkspace,
    })

    expect(currentHistory).toEqual([])
    expect(saveForWorkspace).toHaveBeenCalledWith(
      "official.search.command-bar",
      "workspace-1",
      "search-history",
      [],
    )
  })
})
