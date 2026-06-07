import { describe, expect, it } from "vitest"

import { officialDefaultWorkspacePreset, officialPlugins } from "./index"

describe("officialDefaultWorkspacePreset", () => {
  it("references only builtin plugin manifest ids in preset.plugins", () => {
    const builtinPluginIds = new Set(officialPlugins.map((plugin) => plugin.manifest.id))

    expect(
      officialDefaultWorkspacePreset.plugins.filter((pluginId) => !builtinPluginIds.has(pluginId)),
    ).toEqual([])
  })

  it("references a current official layout contribution id", () => {
    const layoutIds = officialPlugins.flatMap((plugin) =>
      (plugin.manifest.contributes.layouts ?? []).map((layout) => layout.id),
    )

    expect(layoutIds).toContain(officialDefaultWorkspacePreset.layoutId)
  })

  it("includes every preset instance plugin in preset.plugins", () => {
    const presetPluginIds = new Set(officialDefaultWorkspacePreset.plugins)

    expect(
      officialDefaultWorkspacePreset.instances
        .map((instance) => instance.pluginId)
        .filter((pluginId) => !presetPluginIds.has(pluginId)),
    ).toEqual([])
  })
})
