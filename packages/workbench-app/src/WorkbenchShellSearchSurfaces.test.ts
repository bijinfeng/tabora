import type {
  PluginInstance,
  SearchCommandEntry,
  SearchHistoryEntry,
  SearchProviderContribution,
  SearchWidgetEntry,
} from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"

import { createWorkbenchSearchSurfaces } from "./WorkbenchShellSearchSurfaces"

const providers: SearchProviderContribution[] = [
  {
    id: "official.search.google",
    title: "Google",
    shortcut: "g",
    urlTemplate: "https://google.example/search?q={query}",
  },
]

const commands: SearchCommandEntry[] = [
  { id: "toggle-theme", icon: "T", name: "切换主题", desc: "明暗切换", action: vi.fn() },
]

const widgets: SearchWidgetEntry[] = [
  { instanceId: "widget-1", icon: "W", name: "便签", desc: "快速记录", action: vi.fn() },
]

const history: SearchHistoryEntry[] = [
  {
    query: "tabora",
    providerId: "official.search.google",
    timestamp: "2026-06-07T00:00:00.000Z",
  },
]

function instance(overrides: Partial<PluginInstance> = {}): PluginInstance {
  return {
    id: "search-1",
    workspaceId: "workspace-1",
    pluginId: "official.search.command-bar",
    contributionId: "official.search.command-bar",
    extensionPoint: "search",
    regionId: "top",
    enabled: true,
    config: {},
    createdAt: "2026-06-07T00:00:00.000Z",
    updatedAt: "2026-06-07T00:00:00.000Z",
    ...overrides,
  }
}

describe("createWorkbenchSearchSurfaces", () => {
  it("builds inline search props from current signal-style getters", () => {
    const setInlineSearchQuery = vi.fn()
    const setInlineSearchOpen = vi.fn()
    const setInlineSearchActiveResultIndex = vi.fn()
    const setDefaultProvider = vi.fn()
    const saveHistory = vi.fn(async () => {})
    const openExternalForPlugin = vi.fn(() => true)
    const openExternal = vi.fn(() => true)
    const showToast = vi.fn()

    const surfaces = createWorkbenchSearchSurfaces({
      getProviders: () => providers,
      getDefaultProviderId: () => "official.search.google",
      getCommands: () => commands,
      getWidgets: () => widgets,
      getHistory: () => history,
      getInlineSearchQuery: () => "tabora",
      getInlineSearchOpen: () => true,
      getInlineSearchActiveResultIndex: () => 0,
      setInlineSearchQuery,
      setInlineSearchOpen,
      setInlineSearchActiveResultIndex,
      setDefaultProvider,
      saveHistory,
      openExternalForPlugin,
      openExternal,
      showToast,
      isCommandPaletteOpen: () => false,
      closeCommandPalette: vi.fn(),
    })

    const props = surfaces.buildInlineSearchViewProps(instance())

    expect(props.entry).toBe("inline")
    expect(props.query).toBe("tabora")
    expect(props.isOpen).toBe(true)
    expect(props.providers).toEqual(providers)
    expect(props.defaultProviderId).toBe("official.search.google")

    props.host.setQuery("@g hello")
    expect(setInlineSearchQuery).toHaveBeenCalledWith("@g hello")
    expect(setInlineSearchActiveResultIndex).toHaveBeenCalledWith(-1)
  })

  it("builds command palette props from the same search data sources", () => {
    const closeCommandPalette = vi.fn()
    const saveHistory = vi.fn(async () => {})
    const openExternal = vi.fn(() => true)

    const surfaces = createWorkbenchSearchSurfaces({
      getProviders: () => providers,
      getDefaultProviderId: () => "official.search.google",
      getCommands: () => commands,
      getWidgets: () => widgets,
      getHistory: () => history,
      getInlineSearchQuery: () => "",
      getInlineSearchOpen: () => false,
      getInlineSearchActiveResultIndex: () => -1,
      setInlineSearchQuery: vi.fn(),
      setInlineSearchOpen: vi.fn(),
      setInlineSearchActiveResultIndex: vi.fn(),
      setDefaultProvider: vi.fn(),
      saveHistory,
      openExternalForPlugin: vi.fn(() => true),
      openExternal,
      showToast: vi.fn(),
      isCommandPaletteOpen: () => true,
      closeCommandPalette,
    })

    const props = surfaces.buildCommandPaletteProps()

    expect(props).toMatchObject({
      isOpen: true,
      commands,
      widgets,
      providers,
      defaultProviderId: "official.search.google",
      searchHistory: history,
      openExternal,
      onSaveHistory: saveHistory,
    })

    props.onClose()
    expect(closeCommandPalette).toHaveBeenCalled()
  })
})
