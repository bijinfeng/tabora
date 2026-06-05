import { describe, expect, it } from "vitest"
import type { BuiltinPlugin } from "./pluginKernel"
import { createBuiltinPluginLoader } from "./pluginLoader"

const plugin: BuiltinPlugin = {
  manifest: {
    id: "test.plugin",
    name: "Test Plugin",
    version: "1.0.0",
    entry: "builtin:test.plugin",
    engine: { platform: "tabora" },
    contributes: {},
  },
  enabled: true,
  activate() {},
}

describe("createBuiltinPluginLoader", () => {
  it("returns builtin plugin records with source recorded", async () => {
    const loader = createBuiltinPluginLoader([plugin])

    const result = await loader.load()

    expect(result.loaded).toHaveLength(1)
    expect(result.loaded[0]?.plugin).toBe(plugin)
    expect(result.loaded[0]?.source).toBe("builtin")
    expect(result.rejected).toEqual([])
  })

  it("rejects invalid manifests", async () => {
    const loader = createBuiltinPluginLoader([
      {
        ...plugin,
        manifest: {
          ...plugin.manifest,
          id: "",
        },
      },
    ])

    const result = await loader.load()

    expect(result.loaded).toEqual([])
    expect(result.rejected).toMatchObject([
      {
        source: "builtin",
        reason: "Invalid plugin manifest",
      },
    ])
  })
})
