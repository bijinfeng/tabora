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
})
