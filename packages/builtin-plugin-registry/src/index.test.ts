import { describe, expect, it } from "vitest"
import { officialPlugins } from "@tabora/official-plugins"
import officialPluginsManifest from "../../official-plugins/package.json"
import layoutDashboardManifest from "../../../plugins/official/layout-dashboard/package.json"
import widgetNotesManifest from "../../../plugins/official/widget-notes/package.json"
import widgetQuickLinksManifest from "../../../plugins/official/widget-quick-links/package.json"
import widgetTodoManifest from "../../../plugins/official/widget-todo/package.json"
import widgetWeatherManifest from "../../../plugins/official/widget-weather/package.json"
import { builtinPlugins } from "./index"

const stylePackages = [
  {
    manifest: officialPluginsManifest,
    buildEntry: "src/index.ts",
  },
  {
    manifest: layoutDashboardManifest,
    buildEntry: "src/index.tsx",
  },
  {
    manifest: widgetNotesManifest,
    buildEntry: "src/index.ts",
  },
  {
    manifest: widgetQuickLinksManifest,
    buildEntry: "src/index.ts",
  },
  {
    manifest: widgetTodoManifest,
    buildEntry: "src/index.ts",
  },
  {
    manifest: widgetWeatherManifest,
    buildEntry: "src/index.ts",
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
      expect(manifest.scripts.build).toContain("build-stylex-package.mjs")
      expect(manifest.scripts.build).toContain(stylePackage.buildEntry)
      expect(manifest.dependencies["@stylexjs/stylex"]).toBe("catalog:style")
    }
  })

  it("includes the official plugin pack plus community verification layouts", () => {
    expect(builtinPlugins.length).toBeGreaterThan(officialPlugins.length)
    expect(
      builtinPlugins.some((plugin) => plugin.manifest.id === "official.layout.workbench-dashboard"),
    ).toBe(true)
    expect(
      builtinPlugins.some((plugin) => plugin.manifest.id === "community.layout.diy-masonry"),
    ).toBe(true)
  })

  it("keeps community verification layouts out of officialPlugins", () => {
    expect(
      officialPlugins.some((plugin) => plugin.manifest.id === "community.layout.diy-masonry"),
    ).toBe(false)
  })

  it("exposes the current builtin list for shell bootstrap", () => {
    expect(builtinPlugins.map((plugin) => plugin.manifest.id)).toContain(
      "community.layout.diy-masonry",
    )
  })

  it("attaches resolved stylesheet assets to styled builtin plugins", () => {
    const styledPlugins = builtinPlugins.filter((plugin) => plugin.manifest.styles?.length)
    const missingStyleAssets = styledPlugins.flatMap((plugin) =>
      (plugin.manifest.styles ?? [])
        .filter((style) => !Object.hasOwn(plugin.styleAssetUrls ?? {}, style.href))
        .map((style) => ({ pluginId: plugin.manifest.id, href: style.href })),
    )

    expect(styledPlugins.map((plugin) => plugin.manifest.id)).toEqual(
      expect.arrayContaining([
        "official.layout.workbench-dashboard",
        "official.search.command-bar",
        "official.widgets.notes",
        "community.layout.diy-masonry",
      ]),
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
            ].includes(plugin.manifest.id),
          )
          .map((plugin) => [plugin.manifest.id, plugin.manifest.styles?.[0]?.href]),
      ),
    ).toEqual({
      "official.search.command-bar": "./styles.css",
      "official.plugin-manager": "./styles.css",
      "official.settings.workspace": "./styles.css",
    })
  })
})
