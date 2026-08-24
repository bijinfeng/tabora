import { describe, expect, it } from "vitest"
import type { PluginManifest } from "@tabora/plugin-api"
import { createPluginCatalog } from "./plugin-catalog"

const plugins: Array<{ manifest: PluginManifest; enabled: boolean }> = [
  {
    enabled: true,
    manifest: {
      id: "plugin.alpha",
      name: "Alpha",
      version: "1.0.0",
      apiVersion: "1.0.0",
      entry: "./alpha",
      engine: { platform: "^0.1.0" },
      permissions: [],
      contributes: {
        layouts: [
          {
            id: "alpha.layout",
            title: "Alpha Layout",
            view: "alpha.layout.view",
            regions: [],
            defaultRegions: {},
            supportsResponsive: true,
          },
        ],
        searchProviders: [
          {
            id: "alpha.search.google",
            title: "Google",
            urlTemplate: "https://google.com/search?q={query}",
          },
        ],
        searches: [
          {
            id: "shared.search",
            title: "Alpha Search",
            view: "alpha.search.view",
          },
        ],
        backgroundProviders: [
          {
            id: "alpha.background",
            title: "Alpha Background",
            sourceType: "collection",
          },
        ],
        themes: [
          {
            id: "alpha.theme",
            title: "Alpha Theme",
            tokens: {},
          },
        ],
        widgets: [
          {
            id: "shared",
            title: "Alpha Widget",
            icon: "target",
            description: "Owned by alpha",
            supportedSizes: ["S", "M"],
            defaultSize: "M",
            allowMultipleInstances: true,
            views: { card: "alpha.card" },
          },
        ],
        settingsPanels: [
          {
            id: "alpha.settings",
            title: "Alpha Settings",
            content: { kind: "custom-view", view: "alpha.settings.view" },
            section: "general",
            scope: "workspace",
            surfaces: ["desktop", "mobile"],
            order: 20,
          },
        ],
      },
    },
  },
  {
    enabled: false,
    manifest: {
      id: "plugin.beta",
      name: "Beta",
      version: "2.0.0",
      apiVersion: "1.0.0",
      entry: "./beta",
      engine: { platform: "^0.1.0" },
      contributes: {
        layouts: [
          {
            id: "beta.layout",
            title: "Beta Layout",
            view: "beta.layout.view",
            regions: [],
            defaultRegions: {},
            supportsResponsive: true,
          },
        ],
        searchProviders: [
          {
            id: "beta.search.duck",
            title: "DuckDuckGo",
            urlTemplate: "https://duckduckgo.com/?q={query}",
          },
        ],
        searches: [
          {
            id: "shared.search",
            title: "Beta Search",
            view: "beta.search.view",
          },
        ],
        backgroundProviders: [
          {
            id: "beta.background",
            title: "Beta Background",
            sourceType: "collection",
          },
        ],
        themes: [
          {
            id: "beta.theme",
            title: "Beta Theme",
            tokens: {},
          },
        ],
        widgets: [
          {
            id: "shared",
            title: "Beta Widget",
            supportedSizes: ["S"],
            defaultSize: "S",
            allowMultipleInstances: false,
            views: { card: "beta.card" },
          },
        ],
        settingsPanels: [
          {
            id: "beta.settings",
            title: "Beta Settings",
            content: { kind: "custom-view", view: "beta.settings.view" },
            section: "general",
            scope: "workspace",
            surfaces: ["desktop", "mobile"],
            order: 10,
          },
        ],
      },
    },
  },
]

describe("createPluginCatalog", () => {
  it("resolves widget contributions by plugin id and contribution id", () => {
    const catalog = createPluginCatalog(plugins)

    expect(catalog.findWidgetContribution("plugin.alpha", "shared")?.views.card).toBe("alpha.card")
    expect(catalog.findWidgetContribution("plugin.beta", "shared")).toBeUndefined()
  })

  it("resolves search contributions from enabled plugins only", () => {
    const catalog = createPluginCatalog(plugins)

    expect(catalog.findSearchContribution("plugin.alpha", "shared.search")?.view).toBe(
      "alpha.search.view",
    )
    expect(catalog.findSearchContribution("plugin.beta", "shared.search")).toBeUndefined()
  })

  it("applies widget presentation fallbacks from the catalog boundary", () => {
    const catalog = createPluginCatalog(plugins)

    expect(catalog.findWidgetContribution("plugin.alpha", "shared")?.description).toBe(
      "Owned by alpha",
    )
  })

  it("returns sorted settings panels and plugin summaries", () => {
    const catalog = createPluginCatalog(plugins)

    expect(catalog.listSettingsPanels().map((panel) => panel.id)).toEqual(["alpha.settings"])
    expect(catalog.pluginSummaries()).toMatchObject([
      { id: "plugin.alpha", enabled: true },
      { id: "plugin.beta", enabled: false },
    ])
  })

  it("merges plugin record compatibility status into summaries", () => {
    const catalog = createPluginCatalog(plugins)

    expect(
      catalog.pluginSummaries([
        {
          id: "plugin.beta",
          status: "skipped",
          disabledReason: "Missing host capabilities: network",
        },
      ]),
    ).toMatchObject([
      { id: "plugin.alpha", enabled: true },
      {
        id: "plugin.beta",
        enabled: false,
        status: "skipped",
        disabledReason: "Missing host capabilities: network",
      },
    ])
  })

  it("lists search providers with owner metadata", () => {
    const catalog = createPluginCatalog(plugins)

    expect(catalog.listSearchProviders()).toEqual([
      {
        id: "alpha.search.google",
        title: "Google",
        urlTemplate: "https://google.com/search?q={query}",
        pluginId: "plugin.alpha",
        pluginName: "Alpha",
        ref: {
          pluginId: "plugin.alpha",
          kind: "search-provider",
          id: "alpha.search.google",
        },
      },
    ])
  })

  it("excludes disabled plugin contributions while retaining plugin summaries", () => {
    const catalog = createPluginCatalog(plugins)
    const widgets = catalog.listWidgetContributions()
    const panels = catalog.listSettingsPanels()
    const summaries = catalog.pluginSummaries()

    expect(catalog.listThemes().map((theme) => theme.id)).toEqual(["alpha.theme"])
    expect(catalog.listBackgroundProviders().map((provider) => provider.id)).toEqual([
      "alpha.background",
    ])
    expect(catalog.listLayouts().map((layout) => layout.id)).toEqual(["alpha.layout"])
    expect(widgets.map((widget) => `${widget.pluginId}:${widget.title}`)).toEqual([
      "plugin.alpha:Alpha Widget",
    ])
    expect(widgets).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ pluginId: "plugin.beta" })]),
    )
    expect(panels.map((panel) => `${panel.pluginId}:${panel.id}`)).toEqual([
      "plugin.alpha:alpha.settings",
    ])
    expect(panels).not.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: "beta.settings" })]),
    )
    expect(summaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: "plugin.alpha", enabled: true }),
        expect.objectContaining({ id: "plugin.beta", enabled: false }),
      ]),
    )
  })

  it("lists injected builtin themes with the host plugin id and resolves them by ref", () => {
    const catalog = createPluginCatalog(plugins, {
      builtinThemes: {
        pluginId: "host.theme",
        themes: [{ id: "host.theme.light", title: "Light", tokens: { "color-page": "0 0 0" } }],
      },
    })

    expect(catalog.listThemes().map((theme) => `${theme.ref.pluginId}:${theme.id}`)).toEqual([
      "host.theme:host.theme.light",
      "plugin.alpha:alpha.theme",
    ])
    expect(
      catalog.resolveContribution({
        pluginId: "host.theme",
        kind: "theme",
        id: "host.theme.light",
      }),
    ).toMatchObject({ id: "host.theme.light", title: "Light" })
  })

  it("lists injected builtin search providers with the host plugin id and resolves them by ref", () => {
    const catalog = createPluginCatalog(plugins, {
      builtinSearchProviders: {
        pluginId: "host.search",
        providers: [
          {
            id: "host.search.google",
            title: "Google",
            urlTemplate: "https://google.com/search?q={query}",
            shortcut: "g",
          },
        ],
      },
    })

    expect(
      catalog.listSearchProviders().map((provider) => `${provider.ref.pluginId}:${provider.id}`),
    ).toEqual(["host.search:host.search.google", "plugin.alpha:alpha.search.google"])
    expect(
      catalog.resolveContribution({
        pluginId: "host.search",
        kind: "search-provider",
        id: "host.search.google",
      }),
    ).toMatchObject({ id: "host.search.google", title: "Google" })
  })

  it("lists injected builtin background providers with the host plugin id and resolves them by ref", () => {
    const catalog = createPluginCatalog(plugins, {
      builtinBackgroundProviders: {
        pluginId: "host.background",
        providers: [
          {
            id: "host.background.solid",
            title: "Solid",
            sourceType: "generated",
            source: { type: "css", css: { background: "#fff" } },
            defaultCss: { background: "#fff" },
          },
        ],
      },
    })

    expect(
      catalog
        .listBackgroundProviders()
        .map((provider) => `${provider.ref.pluginId}:${provider.id}`),
    ).toEqual(["host.background:host.background.solid", "plugin.alpha:alpha.background"])
    expect(
      catalog.resolveContribution({
        pluginId: "host.background",
        kind: "background-provider",
        id: "host.background.solid",
      }),
    ).toMatchObject({ id: "host.background.solid", title: "Solid" })
  })
})
