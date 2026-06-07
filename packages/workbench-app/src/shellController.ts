import type {
  LayoutContribution,
  PluginInstance,
  PluginManifest,
  Workspace,
} from "@tabora/plugin-api"
import { createLayoutSwitchPlan, type LayoutSwitchPlan } from "@tabora/orchestrator"

const UNPLACED_REGION_ID = "unplaced"

export function canPluginOpenExternal(options: {
  pluginId: string
  url: string
  plugins: Array<{ manifest: Pick<PluginManifest, "id" | "permissions"> }>
}): boolean {
  let hostname: string
  try {
    hostname = new URL(options.url).hostname
  } catch {
    return false
  }

  const plugin = options.plugins.find((item) => item.manifest.id === options.pluginId)
  if (!plugin) return false

  return (plugin.manifest.permissions ?? []).some((permission) => {
    if (permission.type !== "external-open") return false
    return permission.hosts.some((host) => host === "*" || host === hostname)
  })
}

export type LayoutSwitchExecution = {
  plan: LayoutSwitchPlan
  instances: PluginInstance[]
}

export function createLayoutSwitchExecution(options: {
  workspace: Workspace
  instances: PluginInstance[]
  targetLayout: LayoutContribution
  now?: string
}): LayoutSwitchExecution {
  const plan = createLayoutSwitchPlan({
    workspace: options.workspace,
    instances: options.instances,
    targetLayout: options.targetLayout,
  })
  const now = options.now ?? new Date().toISOString()
  const nextInstances = new Map(
    [
      ...plan.placedInstances,
      ...plan.unplacedInstances.map((instance) => ({ ...instance, regionId: UNPLACED_REGION_ID })),
    ].map((instance) => [instance.id, instance]),
  )

  return {
    plan,
    instances: options.instances.map((currentInstance) => {
      const nextInstance = nextInstances.get(currentInstance.id) ?? currentInstance
      return currentInstance.regionId !== nextInstance.regionId
        ? { ...nextInstance, updatedAt: now }
        : nextInstance
    }),
  }
}
