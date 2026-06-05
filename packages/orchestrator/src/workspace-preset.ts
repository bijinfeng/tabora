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

function cloneJsonValue<T>(value: T): T {
  if (value === undefined || value === null) return value
  return JSON.parse(JSON.stringify(value)) as T
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
        accepts: [...region.accepts],
        instances: [],
      },
    ]),
  )

  const instances: PluginInstance[] = []

  for (const presetInstance of options.preset.instances) {
    const region = regions[presetInstance.regionId]
    if (!region) {
      throw new Error(
        `Workspace preset "${options.preset.id}" instance "${presetInstance.instanceId}" targets unknown region "${presetInstance.regionId}"`,
      )
    }
    if (!region.accepts.includes(presetInstance.extensionPoint)) {
      throw new Error(
        `Workspace preset "${options.preset.id}" instance "${presetInstance.instanceId}" uses extension point "${presetInstance.extensionPoint}" incompatible with region "${presetInstance.regionId}"`,
      )
    }

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
      config: cloneJsonValue(presetInstance.config ?? {}),
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
        search: {
          defaultProviderId: options.preset.search.defaultProviderId,
          ...(options.preset.search.enabledProviderIds
            ? { enabledProviderIds: [...options.preset.search.enabledProviderIds] }
            : {}),
        },
      },
      regions,
      createdAt: now,
      updatedAt: now,
    },
    instances,
  }
}
