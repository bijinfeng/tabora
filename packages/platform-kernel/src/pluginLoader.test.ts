import { describe, expect, it } from "vitest"
import type { BuiltinPlugin } from "./pluginKernel"
import type { PluginManifest } from "@tabora/plugin-api"
import { createBuiltinPluginLoader, parseTrustedLocalPluginPackage } from "./pluginLoader"

const plugin: BuiltinPlugin = {
  manifest: {
    id: "test.plugin",
    name: "Test Plugin",
    version: "1.0.0",
    apiVersion: "1.0.0",
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

  it("loads plugins with compatible api versions", async () => {
    const loader = createBuiltinPluginLoader([
      {
        ...plugin,
        manifest: {
          ...plugin.manifest,
          apiVersion: "1.5.0",
        },
      },
    ])

    const result = await loader.load()

    expect(result.loaded).toHaveLength(1)
    expect(result.rejected).toEqual([])
  })

  it("rejects plugins with future major api versions", async () => {
    const loader = createBuiltinPluginLoader([
      {
        ...plugin,
        manifest: {
          ...plugin.manifest,
          apiVersion: "2.0.0",
        },
      },
    ])

    const result = await loader.load()

    expect(result.loaded).toEqual([])
    expect(result.rejected).toMatchObject([
      {
        source: "builtin",
        reason: 'Incompatible plugin apiVersion "2.0.0"',
      },
    ])
  })

  it("rejects plugins without apiVersion", async () => {
    const { apiVersion: _apiVersion, ...manifest } = plugin.manifest
    const loader = createBuiltinPluginLoader([
      { ...plugin, manifest: manifest as unknown as PluginManifest },
    ])

    const result = await loader.load()

    expect(result.loaded).toEqual([])
    expect(result.rejected).toMatchObject([
      {
        source: "builtin",
        reason: "Plugin manifest must declare apiVersion",
      },
    ])
  })

  it("parses trusted local plugin package metadata", () => {
    const parsed = parseTrustedLocalPluginPackage({
      package: {
        name: "@local/test-plugin",
        version: "1.0.0",
      },
      tabora: plugin.manifest,
      entry: "./dist/index.js",
    })

    expect(parsed).toEqual({
      packageName: "@local/test-plugin",
      packageVersion: "1.0.0",
      manifest: plugin.manifest,
      entry: "./dist/index.js",
      source: "local-trusted",
    })
  })
})
