import type { LayoutContribution, PluginInstance, Workspace } from "@tabora/plugin-api"

export type LayoutSwitchPlanOptions = {
  workspace: Workspace
  instances: PluginInstance[]
  targetLayout: LayoutContribution
}

export type LayoutSwitchPlan = {
  nextRegions: Workspace["regions"]
  migratedInstances: PluginInstance[]
  unplacedInstances: PluginInstance[]
  snapshot: {
    layoutId: string
    regions: Workspace["regions"]
    instances: PluginInstance[]
  }
}

export function createLayoutSwitchPlan(options: LayoutSwitchPlanOptions): LayoutSwitchPlan {
  const { workspace, instances, targetLayout } = options
  const nextRegions: Workspace["regions"] = Object.fromEntries(
    targetLayout.regions.map((region) => [
      region.id,
      {
        regionId: region.id,
        accepts: region.accepts,
        instances: [],
      },
    ]),
  )
  const migratedInstances: PluginInstance[] = []
  const unplacedInstances: PluginInstance[] = []

  for (const instance of instances) {
    const sameRegion = targetLayout.regions.find(
      (region) =>
        region.id === instance.regionId && region.accepts.includes(instance.extensionPoint),
    )
    const nextRegion =
      sameRegion ??
      targetLayout.regions.find((region) => region.accepts.includes(instance.extensionPoint))

    if (!nextRegion) {
      unplacedInstances.push(instance)
      continue
    }

    const migratedInstance =
      nextRegion.id === instance.regionId ? instance : { ...instance, regionId: nextRegion.id }
    migratedInstances.push(migratedInstance)
    nextRegions[nextRegion.id]?.instances.push({ instanceId: migratedInstance.id })
  }

  return {
    nextRegions,
    migratedInstances,
    unplacedInstances,
    snapshot: {
      layoutId: workspace.activeLayoutId,
      regions: workspace.regions,
      instances,
    },
  }
}
