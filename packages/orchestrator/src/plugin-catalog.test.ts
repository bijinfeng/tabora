import { describe, expect, it } from "vitest"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { createPluginCatalog } from "./plugin-catalog"

const plugins: BuiltinPlugin[] = [
  {
    enabled: true,
    manifest: {
      id: "plugin.alpha",
      name: "Alpha",
      version: "1.0.0",
      entry: "./alpha",
      engine: { platform: "^0.1.0" },
      permissions: [{ type: "storage", scope: "plugin" }],
      contributes: {
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
            view: "alpha.settings.view",
            section: "general",
            scope: "workspace",
            order: 20,
          },
        ],
      },
    },
    activate() {},
  },
  {
    enabled: false,
    manifest: {
      id: "plugin.beta",
      name: "Beta",
      version: "2.0.0",
      entry: "./beta",
      engine: { platform: "^0.1.0" },
      contributes: {
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
            view: "beta.settings.view",
            section: "general",
            scope: "workspace",
            order: 10,
          },
        ],
      },
    },
    activate() {},
  },
]

describe("createPluginCatalog", () => {
  it("resolves widget contributions by plugin id and contribution id", () => {
    const catalog = createPluginCatalog(plugins)

    expect(catalog.findWidgetContribution("plugin.alpha", "shared")?.views.card).toBe("alpha.card")
    expect(catalog.findWidgetContribution("plugin.beta", "shared")?.views.card).toBe("beta.card")
  })

  it("applies widget presentation fallbacks from the catalog boundary", () => {
    const catalog = createPluginCatalog(plugins)

    expect(catalog.findWidgetContribution("plugin.alpha", "shared")?.description).toBe(
      "Owned by alpha",
    )
    expect(catalog.findWidgetContribution("plugin.beta", "shared")?.description).toBe(
      "添加 Beta Widget 卡片",
    )
  })

  it("returns sorted settings panels and plugin summaries", () => {
    const catalog = createPluginCatalog(plugins)

    expect(catalog.listSettingsPanels().map((panel) => panel.id)).toEqual([
      "beta.settings",
      "alpha.settings",
    ])
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
})
