import type { LayoutContribution, PluginInstance, Workspace } from "@tabora/plugin-api"
import type { LayoutSwitchPlan } from "@tabora/orchestrator"

type LayoutSwitchExecution =
  | PluginInstance[]
  | {
      instances: PluginInstance[]
      plan: LayoutSwitchPlan
    }

export async function reconcileWorkbenchLayoutInstances(options: {
  layoutId: string
  currentInstances: PluginInstance[]
  activeWorkspace: Workspace
  findLayout: (layoutId: string) => LayoutContribution | undefined
  executeLayoutSwitch: (options: {
    workspace: Workspace
    instances: PluginInstance[]
    targetLayout: LayoutContribution
  }) => LayoutSwitchExecution
  assignGridOrder: (instances: PluginInstance[]) => PluginInstance[]
  saveInstance: (instance: PluginInstance) => Promise<void>
}): Promise<{ instances: PluginInstance[]; plan: LayoutSwitchPlan | null }> {
  const targetLayout = options.findLayout(options.layoutId)
  if (!targetLayout) {
    return {
      instances: options.currentInstances,
      plan: null,
    }
  }

  const execution = options.executeLayoutSwitch({
    workspace: options.activeWorkspace,
    instances: options.currentInstances,
    targetLayout,
  })

  if (Array.isArray(execution)) {
    return {
      instances: options.assignGridOrder(execution),
      plan: null,
    }
  }

  for (let index = 0; index < execution.instances.length; index += 1) {
    const previous = options.currentInstances[index]
    const next = execution.instances[index]
    if (
      previous &&
      next &&
      (previous.regionId !== next.regionId || previous.updatedAt !== next.updatedAt)
    ) {
      await options.saveInstance(next)
    }
  }

  return {
    instances: options.assignGridOrder(execution.instances),
    plan: execution.plan,
  }
}

export async function switchWorkbenchLayout(options: {
  layoutId: string
  activeWorkspace: Workspace
  currentInstances: PluginInstance[]
  findLayout: (layoutId: string) => LayoutContribution | undefined
  reconcileInstances: (
    layoutId: string,
    currentInstances: PluginInstance[],
  ) => Promise<{ instances: PluginInstance[]; plan: LayoutSwitchPlan | null }>
  clearContextMenu: () => void
  clearExpandState: () => void
  setInstances: (instances: PluginInstance[]) => void
  setActiveLayoutId: (layoutId: string) => void
  saveSnapshot: (snapshot: LayoutSwitchPlan["snapshot"]) => Promise<void>
  persistWorkspaceLayout: (
    workspaceId: string,
    layoutId: string,
    regions: Workspace["regions"],
  ) => Promise<Workspace | null>
  setWorkspaceState: (workspace: Workspace) => void
}) {
  const targetLayout = options.findLayout(options.layoutId)
  if (!targetLayout) return

  options.clearContextMenu()
  options.clearExpandState()

  const { instances, plan } = await options.reconcileInstances(
    options.layoutId,
    options.currentInstances,
  )
  options.setInstances(instances)
  options.setActiveLayoutId(options.layoutId)

  if (!plan) return

  await options.saveSnapshot(plan.snapshot)
  const workspace = await options.persistWorkspaceLayout(
    options.activeWorkspace.id,
    options.layoutId,
    plan.nextRegions,
  )
  if (workspace) {
    options.setWorkspaceState(workspace)
  }
}
