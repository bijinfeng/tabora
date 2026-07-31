import type { PluginManifest } from "@tabora/plugin-api"

import type { BuiltinPlugin } from "./pluginKernel"

type LazyBuiltinPluginOptions = {
  manifest: PluginManifest
  enabled: boolean
  load(): Promise<BuiltinPlugin>
}

export function createLazyBuiltinPlugin(options: LazyBuiltinPluginOptions): BuiltinPlugin {
  let loadedPlugin: Promise<BuiltinPlugin> | undefined

  function loadPlugin(): Promise<BuiltinPlugin> {
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
    manifest: options.manifest,
    enabled: options.enabled,
    async preload() {
      await loadPlugin()
    },
    async activate(context) {
      return (await loadPlugin()).activate(context)
    },
  }
}
