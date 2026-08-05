import type { PluginManifest, PluginSyncCollection } from "@tabora/plugin-api"

/** Host-resolved sync policy keyed by plugin and manifest-declared collection. */
export type PluginSyncCollections = ReadonlyMap<string, ReadonlyMap<string, PluginSyncCollection>>

/** Data omitted from this map remains local-only by construction. */
export function createPluginSyncCollections(
  manifests: readonly PluginManifest[],
): PluginSyncCollections {
  const byPlugin = new Map<string, ReadonlyMap<string, PluginSyncCollection>>()
  for (const manifest of manifests) {
    const collections = manifest.sync?.collections ?? []
    if (collections.length === 0) continue
    byPlugin.set(manifest.id, new Map(collections.map((collection) => [collection.id, collection])))
  }
  return byPlugin
}
