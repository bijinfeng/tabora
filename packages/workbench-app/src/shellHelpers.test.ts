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
  resolveWidgetRenderModel,
  resolveWidgetIconLabel,
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
  it("maps supported widget icon names to compact labels and falls back safely", () => {
    expect(resolveWidgetIconLabel("target")).toBe("◎")
    expect(resolveWidgetIconLabel("link")).toBe("↗")
    expect(resolveWidgetIconLabel("pencil")).toBe("✎")
    expect(resolveWidgetIconLabel("check-square")).toBe("✓")
    expect(resolveWidgetIconLabel("sun")).toBe("☼")
    expect(resolveWidgetIconLabel("unknown")).toBe("▦")
    expect(resolveWidgetIconLabel()).toBe("▦")
  })

  it("builds searchable entries only for widget instances with registered contributions", () => {
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

    expect(entries).toHaveLength(1)
    expect(entries).toMatchObject([
      {
        instanceId: "enabled-widget",
        icon: "◎",
        name: "今日重点",
        desc: "定位到 今日重点 卡片",
      },
    ])

    entries[0]!.action()
    expect(focus).toHaveBeenCalledWith("enabled-widget")
  })

  it("requires registered widget contribution and explicit supported size for rendering", () => {
    const notes = widget("notes", "便签", "pencil")
    const sizeMissing = instance("size-missing", "notes")
    delete sizeMissing.size

    expect(resolveWidgetRenderModel(instance("notes-1", "notes"), notes)).toMatchObject({
      title: "便签",
      icon: "pencil",
      currentSize: "M",
      supportedSizes: ["S", "M"],
    })
    expect(resolveWidgetRenderModel(instance("missing-1", "missing"), undefined)).toBeNull()
    expect(resolveWidgetRenderModel(sizeMissing, notes)).toBeNull()
    expect(
      resolveWidgetRenderModel({ ...instance("unsupported-size", "notes"), size: "XL" }, notes),
    ).toBeNull()
  })
})

describe("shell helper search settings resolvers", () => {
  it("returns the explicit enabled provider ids", () => {
    const settings: WorkbenchSearchSettings = {
      defaultProviderId: "google",
      enabledProviderIds: ["google", "duck"],
    }

    expect(resolveEnabledProviderIds(settings)).toEqual(["google", "duck"])
    expect(resolveEnabledSearchProviders(settings, providers)).toEqual(providers)
  })

  it("uses explicit enabled provider ids and preserves provider order", () => {
    const settings: WorkbenchSearchSettings = {
      defaultProviderId: "duck",
      enabledProviderIds: ["duck"],
    }

    expect(resolveEnabledProviderIds(settings)).toEqual(["duck"])
    expect(resolveEnabledSearchProviders(settings, providers)).toEqual([providers[1]])
  })

  it("returns an empty default provider when the configured id is unavailable", () => {
    expect(
      resolveDefaultProviderForSearch(
        { defaultProviderId: "google", enabledProviderIds: ["duck"] },
        providers,
      ),
    ).toBe("google")
    expect(
      resolveDefaultProviderForSearch(
        { defaultProviderId: "missing", enabledProviderIds: ["google", "duck"] },
        providers,
      ),
    ).toBe("")
    expect(
      resolveDefaultProviderForSearch({ defaultProviderId: "google", enabledProviderIds: [] }, []),
    ).toBe("")
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

  it("reports unhandled plugin commands when no plugin runner is configured", () => {
    const widgetInstance = instance("todo-1", "todo")
    const runCommand = createCommandExecutor({
      actions: {},
      pluginCommandIds: ["todo.unhandled"],
    })

    expect(runCommand("todo.unhandled", { instance: widgetInstance })).toBe(false)
  })
})
