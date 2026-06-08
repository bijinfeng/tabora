import { describe, expect, it } from "vitest"
import { officialPlugins } from "@tabora/official-plugins"
import { builtinPlugins } from "./index"

describe("builtinPlugins", () => {
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
        "official.layout.workbench-stream",
        "official.search.command-bar",
        "official.widgets.notes",
        "community.layout.diy-masonry",
      ]),
    )
    expect(missingStyleAssets).toEqual([])
  })
})
