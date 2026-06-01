import type { JSX } from "solid-js"
import type { PluginInstance } from "@tabora/plugin-api"
import type { ExtensionRegistry } from "@tabora/platform-kernel"
import type { InstanceRepository } from "@tabora/storage"
import type { BuiltinPlugin } from "@tabora/platform-kernel"

export type RegionRenderer = {
  render(workspaceId: string, regionId: string): Promise<JSX.Element[]>
}

export type RegionRendererDeps = {
  registry: ExtensionRegistry
  plugins: BuiltinPlugin[]
  instanceRepo: InstanceRepository
  buildViewProps: (instance: PluginInstance) => Record<string, unknown>
}

export function createRegionRenderer(deps: RegionRendererDeps): RegionRenderer {
  function findContribution(instance: PluginInstance) {
    const plugin = deps.plugins.find((p) => p.manifest.id === instance.pluginId)
    if (!plugin) return null
    const c = plugin.manifest.contributes
    switch (instance.extensionPoint) {
      case "widget":
        return c.widgets?.find((w) => w.id === instance.contributionId) ?? null
      case "search":
        return c.searches?.find((s) => s.id === instance.contributionId) ?? null
      default:
        return null
    }
  }

  function resolveViewId(instance: PluginInstance): string | null {
    const contribution = findContribution(instance)
    if (!contribution) return null
    switch (instance.extensionPoint) {
      case "widget":
        return (contribution as any).views?.card ?? null
      case "search":
        return (contribution as any).views?.main ?? null
      default:
        return null
    }
  }

  return {
    async render(workspaceId: string, regionId: string) {
      let instances: PluginInstance[] = []
      try {
        instances = await deps.instanceRepo.getByRegion(workspaceId, regionId)
      } catch {
        /* empty */
      }
      const sorted = instances
        .filter((i) => i.enabled !== false)
        .sort((a, b) => (a.grid?.y ?? 0) - (b.grid?.y ?? 0) || (a.grid?.x ?? 0) - (b.grid?.x ?? 0))

      return sorted.map((instance) => {
        const viewId = resolveViewId(instance)
        if (!viewId || !deps.registry.views.has(viewId)) {
          return <div data-region-error={instance.id}>View missing: {viewId ?? "unknown"}</div>
        }
        const View = deps.registry.views.get(viewId) as (
          props: Record<string, unknown>,
        ) => JSX.Element
        return <View {...deps.buildViewProps(instance)} />
      })
    },
  }
}
