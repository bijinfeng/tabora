import { describe, expect, it, vi } from "vitest"
import type {
  SearchCommandEntry,
  SearchHistoryEntry,
  SearchProviderContribution,
  SearchWidgetEntry,
} from "@tabora/plugin-api"

import { buildWorkbenchSearchSurfaceState } from "./WorkbenchSearchSurfaceState"

const commands: SearchCommandEntry[] = [
  { id: "toggle-theme", icon: "theme", name: "切换主题", desc: "明亮暗色", action: vi.fn() },
]

const widgets: SearchWidgetEntry[] = [
  {
    instanceId: "todo-1",
    icon: "check",
    name: "待办",
    desc: "今日任务",
    action: vi.fn(),
  },
]

const providers: SearchProviderContribution[] = [
  {
    id: "official.search.google",
    title: "Google",
    shortcut: "g",
    urlTemplate: "https://google.example/search?q={query}",
  },
  {
    id: "official.search.bing",
    title: "Bing",
    shortcut: "b",
    urlTemplate: "https://bing.example/search?q={query}",
  },
]

const history: SearchHistoryEntry[] = [
  { query: "solidjs", providerId: "official.search.google", timestamp: "2026-01-01T00:00:00Z" },
]

describe("buildWorkbenchSearchSurfaceState", () => {
  it("builds grouped inline results for an empty query", () => {
    const state = buildWorkbenchSearchSurfaceState({
      query: "",
      providers,
      defaultProviderId: "official.search.google",
      commands,
      widgets,
      history,
      onProviderTokenSelect: vi.fn(),
      onWebSearch: vi.fn(),
    })

    expect(state.providerToken).toBeNull()
    expect(state.activeProviderId).toBe("official.search.google")
    expect(
      state.results.map((group) => [group.label, ...group.items.map((item) => item.name)]),
    ).toEqual([
      ["常用命令", "切换主题"],
      ["最近搜索", "solidjs"],
      ["搜索源", "@g", "@b"],
      ["核心卡片", "待办"],
    ])
  })

  it("exposes provider token state and flattened actions for provider search query", () => {
    const onWebSearch = vi.fn()
    const state = buildWorkbenchSearchSurfaceState({
      query: "@b tabora",
      providers,
      defaultProviderId: "official.search.google",
      commands,
      widgets,
      history,
      onProviderTokenSelect: vi.fn(),
      onWebSearch,
    })

    expect(state.providerToken).toBe("b")
    expect(state.results).toEqual([
      {
        id: "搜索",
        label: "搜索",
        items: [
          {
            id: "provider-search-official.search.bing",
            icon: "🔍",
            name: '在 Bing 中搜索 "tabora"',
            desc: "临时搜索源",
            hint: "b",
          },
        ],
      },
    ])

    state.items[0]?.action()
    expect(onWebSearch).toHaveBeenCalledWith(providers[1], "tabora")
  })
})
