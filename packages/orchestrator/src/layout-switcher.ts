import type {
  ExtensionPoint,
  LayoutContribution,
  PluginInstance,
  Workspace,
} from "@tabora/plugin-api"

const UNPLACED_REGION_ID = "unplaced"
const UNPLACED_REGION_ACCEPTS: ExtensionPoint[] = [
  "layout",
  "widget",
  "search",
  "search-provider",
  "background-provider",
  "background-renderer",
  "theme",
  "settings-panel",
]

export type LayoutSwitchPlanOptions = {
  workspace: Workspace
  instances: PluginInstance[]
  targetLayout: LayoutContribution
}

export type LayoutSwitchPlan = {
  nextRegions: Workspace["regions"]
  placedInstances: PluginInstance[]
  unplacedInstances: PluginInstance[]
  snapshot: {
    id: string
    workspaceId: string
    layoutId: string
    regions: Workspace["regions"]
    instances: PluginInstance[]
    createdAt: string
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
  const placedInstances: PluginInstance[] = []
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

    const placedInstance =
      nextRegion.id === instance.regionId ? instance : { ...instance, regionId: nextRegion.id }
    placedInstances.push(placedInstance)
    nextRegions[nextRegion.id]?.instances.push({ instanceId: placedInstance.id })
  }

  if (unplacedInstances.length > 0) {
    nextRegions[UNPLACED_REGION_ID] = {
      regionId: UNPLACED_REGION_ID,
      accepts: UNPLACED_REGION_ACCEPTS,
      instances: unplacedInstances.map((instance) => ({ instanceId: instance.id })),
    }
  }

  const createdAt = workspace.updatedAt

  return {
    nextRegions,
    placedInstances,
    unplacedInstances,
    snapshot: {
      id: `${workspace.id}:snapshot:${workspace.activeLayoutId}:${targetLayout.id}`,
      workspaceId: workspace.id,
      layoutId: workspace.activeLayoutId,
      regions: workspace.regions,
      instances,
      createdAt,
    },
  }
}
