import type { PluginManifest, PluginModule } from "@tabora/plugin-api"

import type { LoadedPluginPackage } from "./pluginKernel"

type LazyBuiltinPluginOptions = {
  manifest: PluginManifest
  load(): Promise<PluginModule>
  styleAssetUrls?: Record<string, string>
}

/** Creates a builtin loader package; enablement belongs to the kernel installation record. */
export function createLazyBuiltinPlugin(options: LazyBuiltinPluginOptions): LoadedPluginPackage {
  let loadedPlugin: Promise<PluginModule> | undefined

  function loadPlugin(): Promise<PluginModule> {
    loadedPlugin ??= options.load().then((plugin) => {
      if (plugin.manifest.id !== options.manifest.id) {
        throw new Error(
          `Lazy plugin manifest mismatch: expected "${options.manifest.id}", received "${plugin.manifest.id}"`,
        )
      }
      return plugin
    })
    return loadedPlugin
  }

  return {
    source: "builtin",
    module: {
      manifest: options.manifest,
      async activate(context) {
        return (await loadPlugin()).activate(context)
      },
    },
    ...(options.styleAssetUrls ? { styleAssetUrls: options.styleAssetUrls } : {}),
    async preload() {
      await loadPlugin()
    },
  }
}
