import { describe, expect, it } from "vitest"
import type { PluginManifest, PluginModule } from "@tabora/plugin-api"
import { createBuiltinPluginPackage, type LoadedPluginPackage } from "./pluginKernel"
import { createBuiltinPluginLoader } from "./pluginLoader"

const plugin: PluginModule = {
  manifest: {
    id: "test.plugin",
    name: "Test Plugin",
    version: "1.0.0",
    apiVersion: "1.0.0",
    entry: "builtin:test.plugin",
    engine: { platform: "tabora" },
    contributes: {},
  },
  activate() {},
}

function builtin(
  module: PluginModule,
  styleAssetUrls?: Record<string, string>,
): LoadedPluginPackage {
  return createBuiltinPluginPackage(module, styleAssetUrls ? { styleAssetUrls } : {})
}

describe("createBuiltinPluginLoader", () => {
  it("returns builtin plugin records with source recorded", async () => {
    const loader = createBuiltinPluginLoader([builtin(plugin)])

    const result = await loader.load()

    expect(result.loaded).toHaveLength(1)
    expect(result.loaded[0]?.module).toBe(plugin)
    expect(result.loaded[0]?.source).toBe("builtin")
    expect(result.rejected).toEqual([])
  })

  it("resolves builtin plugin stylesheet asset urls", async () => {
    const styledPlugin: PluginModule = {
      ...plugin,
      manifest: {
        ...plugin.manifest,
        styles: [{ href: "./styles.css", scope: "plugin", order: 20 }],
      },
    }
    const loader = createBuiltinPluginLoader([
      builtin(styledPlugin, { "./styles.css": "/assets/test-plugin.css" }),
    ])

    const result = await loader.load()

    expect(result.loaded[0]?.styles).toEqual([
      {
        pluginId: "test.plugin",
        href: "/assets/test-plugin.css",
        sourceHref: "./styles.css",
        scope: "plugin",
        order: 20,
        source: "builtin",
      },
    ])
  })

  it("rejects invalid manifests", async () => {
    const loader = createBuiltinPluginLoader([
      builtin({
        ...plugin,
        manifest: {
          ...plugin.manifest,
          id: "",
        },
      }),
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
      builtin({
        ...plugin,
        manifest: {
          ...plugin.manifest,
          apiVersion: "1.5.0",
        },
      }),
    ])

    const result = await loader.load()

    expect(result.loaded).toHaveLength(1)
    expect(result.rejected).toEqual([])
  })

  it("rejects plugins with future major api versions", async () => {
    const loader = createBuiltinPluginLoader([
      builtin({
        ...plugin,
        manifest: {
          ...plugin.manifest,
          apiVersion: "2.0.0",
        },
      }),
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
      builtin({ ...plugin, manifest: manifest as unknown as PluginManifest }),
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
})
