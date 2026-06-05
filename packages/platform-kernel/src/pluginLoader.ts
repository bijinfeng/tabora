import { pluginManifestSchema, type PluginManifest } from "@tabora/plugin-api"
import type { BuiltinPlugin } from "./pluginKernel"

export type PluginSource = "builtin" | "local-trusted" | "remote-untrusted"

export type PluginLoadRecord = {
  plugin: BuiltinPlugin
  manifest: PluginManifest
  source: PluginSource
}

export type PluginLoadRejectedRecord = {
  source: PluginSource
  reason: string
  manifest?: unknown
}

export type PluginLoadResult = {
  loaded: PluginLoadRecord[]
  rejected: PluginLoadRejectedRecord[]
}

export type PluginLoader = {
  load(): Promise<PluginLoadResult>
}

export function loadBuiltinPlugins(plugins: BuiltinPlugin[]): PluginLoadResult {
  const loaded: PluginLoadRecord[] = []
  const rejected: PluginLoadRejectedRecord[] = []

  for (const plugin of plugins) {
    const parsed = pluginManifestSchema.safeParse(plugin.manifest)
    if (!parsed.success) {
      rejected.push({
        source: "builtin",
        reason: "Invalid plugin manifest",
        manifest: plugin.manifest,
      })
      continue
    }

    loaded.push({
      plugin,
      manifest: parsed.data as PluginManifest,
      source: "builtin",
    })
  }

  return { loaded, rejected }
}

export function createBuiltinPluginLoader(plugins: BuiltinPlugin[]): PluginLoader {
  return {
    async load() {
      return loadBuiltinPlugins(plugins)
    },
  }
}
