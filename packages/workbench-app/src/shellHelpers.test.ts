import type {
  PluginInstance,
  SearchProviderContribution,
  WidgetContribution,
  WorkbenchSearchSettings,
} from "@tabora/plugin-api"
import { describe, expect, it, vi } from "vitest"
import {
  buildSearchableWidgetEntries,
  createCommandExecutor,
  resolveDefaultProviderForSearch,
  resolveEnabledProviderIds,
  resolveEnabledSearchProviders,
  resolveWidgetIconLabel,
  resolveWidgetTitle,
} from "./shellHelpers"

function instance(
  id: string,
  contributionId: string,
  extensionPoint: PluginInstance["extensionPoint"] = "widget",
  enabled = true,
): PluginInstance {
  return {
    id,
    workspaceId: "workspace-1",
    pluginId: "plugin.widgets",
    contributionId,
    extensionPoint,
    regionId: "mainGrid",
    enabled,
    size: "M",
    config: {},
    createdAt: "2026-06-05T00:00:00.000Z",
    updatedAt: "2026-06-05T00:00:00.000Z",
  }
}

function widget(id: string, title: string, icon?: string): WidgetContribution {
  return {
    id,
    title,
    ...(icon ? { icon } : {}),
    supportedSizes: ["S", "M"],
    defaultSize: "M",
    allowMultipleInstances: true,
    views: { card: `${id}.card` },
  }
}

const providers: SearchProviderContribution[] = [
  { id: "google", title: "Google", urlTemplate: "https://google.test?q={query}" },
  { id: "duck", title: "DuckDuckGo", urlTemplate: "https://duck.test?q={query}" },
]

describe("shell helper widget resolvers", () => {
  it("resolves widget title from contribution and falls back to contribution id", () => {
    const known = instance("widget-1", "today")
    const missing = instance("widget-2", "missing-widget")

    expect(resolveWidgetTitle(known, () => widget("today", "今日重点"))).toBe("今日重点")
    expect(resolveWidgetTitle(missing, () => undefined)).toBe("missing-widget")
  })

  it("maps supported widget icon names to compact labels and falls back safely", () => {
    expect(resolveWidgetIconLabel("target")).toBe("◎")
    expect(resolveWidgetIconLabel("link")).toBe("↗")
    expect(resolveWidgetIconLabel("pencil")).toBe("✎")
    expect(resolveWidgetIconLabel("check-square")).toBe("✓")
    expect(resolveWidgetIconLabel("sun")).toBe("☼")
    expect(resolveWidgetIconLabel("unknown")).toBe("▦")
    expect(resolveWidgetIconLabel()).toBe("▦")
  })

  it("builds searchable entries for widget instances and preserves current enabled behavior", () => {
    const focus = vi.fn()
    const entries = buildSearchableWidgetEntries({
      instances: [
        instance("enabled-widget", "today"),
        instance("disabled-widget", "notes", "widget", false),
        instance("search-provider", "google", "search-provider"),
      ],
      resolveWidgetContribution: (_pluginId, contributionId) =>
        contributionId === "today" ? widget("today", "今日重点", "target") : undefined,
      buildFocusAction: (instanceId) => () => focus(instanceId),
    })

    expect(entries).toHaveLength(2)
    expect(entries).toMatchObject([
      {
        instanceId: "enabled-widget",
        icon: "◎",
        name: "今日重点",
        desc: "定位到 今日重点 卡片",
      },
      {
        instanceId: "disabled-widget",
        icon: "▦",
        name: "notes",
        desc: "定位到 notes 卡片",
      },
    ])

    entries[1]!.action()
    expect(focus).toHaveBeenCalledWith("disabled-widget")
  })
})

describe("shell helper search settings resolvers", () => {
  it("enables every provider when settings do not specify ids", () => {
    const settings: WorkbenchSearchSettings = { defaultProviderId: "" }

    expect(resolveEnabledProviderIds(settings, providers)).toEqual(["google", "duck"])
    expect(resolveEnabledSearchProviders(settings, providers)).toEqual(providers)
  })

  it("uses explicit enabled provider ids and preserves provider order", () => {
    const settings: WorkbenchSearchSettings = {
      defaultProviderId: "",
      enabledProviderIds: ["duck"],
    }

    expect(resolveEnabledProviderIds(settings, providers)).toEqual(["duck"])
    expect(resolveEnabledSearchProviders(settings, providers)).toEqual([providers[1]])
  })

  it("resolves the configured default provider before falling back to enabled providers", () => {
    expect(
      resolveDefaultProviderForSearch(
        { defaultProviderId: "google", enabledProviderIds: ["duck"] },
        providers,
      ),
    ).toBe("google")
    expect(resolveDefaultProviderForSearch({ defaultProviderId: "" }, providers)).toBe("google")
    expect(resolveDefaultProviderForSearch({ defaultProviderId: "" }, [])).toBe("")
  })
})

describe("shell helper command execution", () => {
  it("routes platform commands to actions and plugin commands with context to the plugin runner", () => {
    const platformAction = vi.fn()
    const pluginRunner = vi.fn()
    const widgetInstance = instance("todo-1", "todo")
    const runCommand = createCommandExecutor({
      actions: {
        "open-settings": platformAction,
      },
      pluginCommandIds: ["todo.inspect"],
      runPluginCommand: pluginRunner,
    })

    runCommand("open-settings", { instance: widgetInstance })
    runCommand("todo.inspect", { instance: widgetInstance })

    expect(platformAction).toHaveBeenCalledOnce()
    expect(pluginRunner).toHaveBeenCalledWith("todo.inspect", { instance: widgetInstance })
  })

  it("keeps declared plugin commands without a runner as an explicit no-op", () => {
    const runCommand = createCommandExecutor({
      actions: {},
      pluginCommandIds: ["todo.noop"],
    })

    expect(() => runCommand("todo.noop", { instance: instance("todo-1", "todo") })).not.toThrow()
  })
})
