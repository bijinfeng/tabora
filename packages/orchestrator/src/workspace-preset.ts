import type { PluginInstance, Workspace, WorkspacePresetContribution } from "@tabora/plugin-api"

export type WorkspacePresetApplyOptions = {
  preset: WorkspacePresetContribution
  workspaceId: string
  workspaceName?: string
  now?: string
}

export type WorkspacePresetApplyResult = {
  workspace: Workspace
  instances: PluginInstance[]
}

export function applyWorkspacePreset(
  options: WorkspacePresetApplyOptions,
): WorkspacePresetApplyResult {
  const now = options.now ?? new Date().toISOString()
  const regions: Workspace["regions"] = Object.fromEntries(
    options.preset.regions.map((region) => [
      region.regionId,
      {
        regionId: region.regionId,
        accepts: region.accepts,
        instances: [],
      },
    ]),
  )

  const instances: PluginInstance[] = []

  for (const presetInstance of options.preset.instances) {
    const region = regions[presetInstance.regionId]
    if (!region || !region.accepts.includes(presetInstance.extensionPoint)) continue

    region.instances.push({ instanceId: presetInstance.instanceId })
    instances.push({
      id: presetInstance.instanceId,
      workspaceId: options.workspaceId,
      pluginId: presetInstance.pluginId,
      contributionId: presetInstance.contributionId,
      extensionPoint: presetInstance.extensionPoint,
      regionId: presetInstance.regionId,
      enabled: true,
      size: presetInstance.size ?? "M",
      config: presetInstance.config ?? {},
      createdAt: now,
      updatedAt: now,
    })
  }

  return {
    workspace: {
      id: options.workspaceId,
      name: options.workspaceName ?? options.preset.title,
      activeLayoutId: options.preset.layoutId,
      activeThemeId: options.preset.themeId,
      activeBackgroundProviderId: options.preset.backgroundProviderId,
      config: {
        search: options.preset.search,
      },
      regions,
      createdAt: now,
      updatedAt: now,
    },
    instances,
  }
}
