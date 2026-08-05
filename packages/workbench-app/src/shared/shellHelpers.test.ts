import type {
  PluginInstance,
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
  kind: PluginInstance["contribution"]["kind"] = "widget",
  enabled = true,
): PluginInstance {
  return {
    id,
    workspaceId: "workspace-1",
    contribution: { pluginId: "plugin.widgets", kind, id: contributionId },
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

const providerRef = (id: string) => ({
  pluginId: "plugin.search",
  kind: "search-provider" as const,
  id,
})
const providers = [
  {
    id: "google",
    title: "Google",
    urlTemplate: "https://google.test?q={query}",
    ref: providerRef("google"),
  },
  {
    id: "duck",
    title: "DuckDuckGo",
    urlTemplate: "https://duck.test?q={query}",
    ref: providerRef("duck"),
  },
]

describe("shell helper widget resolvers", () => {
  it("maps supported widget icon names to Lucide identifiers and falls back safely", () => {
    expect(resolveWidgetIconLabel("target")).toBe("target")
    expect(resolveWidgetIconLabel("link")).toBe("link")
    expect(resolveWidgetIconLabel("pencil")).toBe("pencil")
    expect(resolveWidgetIconLabel("check-square")).toBe("check-square")
    expect(resolveWidgetIconLabel("sun")).toBe("sun")
    expect(resolveWidgetIconLabel("unknown")).toBe("layout-dashboard")
    expect(resolveWidgetIconLabel()).toBe("layout-dashboard")
  })

  it("builds searchable entries only for widget instances with registered contributions", () => {
    const focus = vi.fn()
    const entries = buildSearchableWidgetEntries({
      instances: [
        instance("enabled-widget", "today"),
        instance("disabled-widget", "notes", "widget", false),
        instance("search-provider", "google", "search"),
      ],
      resolveWidgetContribution: (_pluginId, contributionId) =>
        contributionId === "today" ? widget("today", "今日重点", "target") : undefined,
      buildFocusAction: (instanceId) => () => focus(instanceId),
    })

    expect(entries).toHaveLength(1)
    expect(entries).toMatchObject([
      {
        instanceId: "enabled-widget",
        icon: "target",
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
      defaultProvider: providerRef("google"),
      enabledProviders: [providerRef("google"), providerRef("duck")],
    }

    expect(resolveEnabledProviderIds(settings)).toEqual(["google", "duck"])
    expect(resolveEnabledSearchProviders(settings, providers)).toEqual(providers)
  })

  it("uses explicit enabled provider ids and preserves provider order", () => {
    const settings: WorkbenchSearchSettings = {
      defaultProvider: providerRef("duck"),
      enabledProviders: [providerRef("duck")],
    }

    expect(resolveEnabledProviderIds(settings)).toEqual(["duck"])
    expect(resolveEnabledSearchProviders(settings, providers)).toEqual([providers[1]])
  })

  it("returns an empty default provider when the configured id is unavailable", () => {
    expect(
      resolveDefaultProviderForSearch(
        { defaultProvider: providerRef("google"), enabledProviders: [providerRef("duck")] },
        providers,
      ),
    ).toBe("google")
    expect(
      resolveDefaultProviderForSearch(
        {
          defaultProvider: providerRef("missing"),
          enabledProviders: [providerRef("google"), providerRef("duck")],
        },
        providers,
      ),
    ).toBe("")
    expect(
      resolveDefaultProviderForSearch(
        { defaultProvider: providerRef("google"), enabledProviders: [] },
        [],
      ),
    ).toBe("")
  })
})

describe("shell helper command execution", () => {
  it("routes platform commands to actions and plugin commands with context to the plugin runner", async () => {
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

    await runCommand("open-settings", { instance: widgetInstance })
    await runCommand("todo.inspect", { instance: widgetInstance })

    expect(platformAction).toHaveBeenCalledOnce()
    expect(pluginRunner).toHaveBeenCalledWith("todo.inspect", { instance: widgetInstance })
  })

  it("reports unhandled plugin commands when no plugin runner is configured", async () => {
    const widgetInstance = instance("todo-1", "todo")
    const runCommand = createCommandExecutor({
      actions: {},
      pluginCommandIds: ["todo.unhandled"],
    })

    await expect(runCommand("todo.unhandled", { instance: widgetInstance })).resolves.toBe(false)
  })
})
