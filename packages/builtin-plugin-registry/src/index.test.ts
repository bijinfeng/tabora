import { officialPlugins } from "@tabora/official-plugins"
import { describe, expect, it } from "vitest"
import widgetNotesManifest from "../../../plugins/official/widget-notes/package.json"
import widgetQuickLinksManifest from "../../../plugins/official/widget-quick-links/package.json"
import widgetTodoManifest from "../../../plugins/official/widget-todo/package.json"
import widgetWeatherManifest from "../../../plugins/official/widget-weather/package.json"
import officialPluginsManifest from "../../official-plugins/package.json"
import { builtinPlugins } from "./index"

const stylePackages = [
  {
    manifest: officialPluginsManifest,
    buildEntry:
      "src/index.ts src/workspace-default-preset.ts src/builtinSearchProviders.ts src/builtinBackgroundProviders.ts",
  },
  {
    manifest: widgetNotesManifest,
    buildEntry: "src/index.ts src/manifest.ts",
  },
  {
    manifest: widgetQuickLinksManifest,
    buildEntry: "src/index.ts src/manifest.ts",
  },
  {
    manifest: widgetTodoManifest,
    buildEntry: "src/index.ts src/manifest.ts",
  },
  {
    manifest: widgetWeatherManifest,
    buildEntry: "src/index.ts src/manifest.ts",
  },
] as const

describe("builtinPlugins", () => {
  it("standardizes independently loadable StyleX package assets", () => {
    for (const stylePackage of stylePackages) {
      const manifest = stylePackage.manifest as {
        exports: Record<string, string>
        publishConfig: { exports: Record<string, string> }
        scripts: { build?: string }
        dependencies: Record<string, string>
      }

      expect(manifest.exports["./styles.css"]).toBe("./src/styles.css")
      expect(manifest.publishConfig.exports["./styles.css"]).toBe("./dist/styles.css")
      expect(manifest.scripts.build).toBe(`vp pack ${stylePackage.buildEntry}`)
      expect(manifest.dependencies["@stylexjs/stylex"]).toBe("catalog:style")
    }
  })

  it("exposes the official plugin pack as the default builtin list", () => {
    expect(builtinPlugins.length).toBe(officialPlugins.length)
  })

  it("keeps view implementation loading out of plugin discovery", () => {
    const lazyPluginIds = [
      "official.search.command-bar",
      "official.widgets.weather",
      "official.widgets.todo",
      "official.widgets.quick-links",
      "official.widgets.notes",
      "official.plugin-manager",
      "official.settings.workspace",
    ]

    expect(
      Object.fromEntries(
        builtinPlugins
          .filter((plugin) => lazyPluginIds.includes(plugin.module.manifest.id))
          .map((plugin) => [plugin.module.manifest.id, typeof plugin.preload]),
      ),
    ).toEqual(Object.fromEntries(lazyPluginIds.map((pluginId) => [pluginId, "function"])))
  })

  it("attaches resolved stylesheet assets to styled builtin plugins", () => {
    const styledPlugins = builtinPlugins.filter((plugin) => plugin.module.manifest.styles?.length)
    const missingStyleAssets = styledPlugins.flatMap((plugin) =>
      (plugin.module.manifest.styles ?? [])
        .filter((style) => !Object.hasOwn(plugin.styleAssetUrls ?? {}, style.href))
        .map((style) => ({
          pluginId: plugin.module.manifest.id,
          href: style.href,
        })),
    )

    expect(styledPlugins.map((plugin) => plugin.module.manifest.id)).toEqual(
      expect.arrayContaining(["official.search.command-bar", "official.widgets.notes"]),
    )
    expect(missingStyleAssets).toEqual([])
    expect(
      Object.fromEntries(
        styledPlugins
          .filter((plugin) =>
            [
              "official.search.command-bar",
              "official.plugin-manager",
              "official.settings.workspace",
            ].includes(plugin.module.manifest.id),
          )
          .map((plugin) => [plugin.module.manifest.id, plugin.module.manifest.styles?.[0]?.href]),
      ),
    ).toEqual({
      "official.search.command-bar": "./styles.css",
      "official.plugin-manager": "./styles.css",
      "official.settings.workspace": "./styles.css",
    })
  })
})
