import { describe, expect, it, vi } from "vitest"
import type {
  SearchCommandEntry,
  SearchHistoryEntry,
  SearchProviderContribution,
  SearchWidgetEntry,
} from "@tabora/plugin-api"
import { createCommandPaletteItems } from "./command-palette-model"

const commands: SearchCommandEntry[] = [
  { id: "toggle-theme", icon: "theme", name: "切换主题", desc: "明亮暗色", action: vi.fn() },
  { id: "open-settings", icon: "settings", name: "打开设置", desc: "配置工作台", action: vi.fn() },
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

describe("createCommandPaletteItems", () => {
  it("builds default command, history, and provider entries for an empty query", () => {
    const items = createCommandPaletteItems({ query: "", commands, providers, history })

    expect(items.map((item) => [item.group, item.name])).toEqual([
      ["常用命令", "切换主题"],
      ["常用命令", "打开设置"],
      ["最近搜索", "solidjs"],
      ["搜索源", "@g"],
      ["搜索源", "@b"],
    ])
  })

  it("returns provider suggestions while typing an @ token", () => {
    const items = createCommandPaletteItems({ query: "@b", commands, providers })

    expect(items.map((item) => item.id)).toEqual(["provider-pending-official.search.bing"])
    expect(items[0]!.closeAfterAction).toBe(false)
  })

  it("returns explicit provider search entry for @provider query", () => {
    const items = createCommandPaletteItems({ query: "@g tabora", commands, providers })

    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({
      id: "provider-search-official.search.google",
      group: "搜索",
      name: '在 Google 中搜索 "tabora"',
      closeAfterAction: true,
    })
  })

  it("combines matching commands, widgets, and web search for regular query", () => {
    const items = createCommandPaletteItems({
      query: "待办",
      commands,
      widgets,
      providers,
      defaultProviderId: "official.search.bing",
    })

    expect(items.map((item) => [item.group, item.name])).toEqual([
      ["卡片", "待办"],
      ["搜索", '在 Bing 中搜索 "待办"'],
    ])
  })
})
