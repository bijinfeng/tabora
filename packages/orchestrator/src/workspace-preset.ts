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

type PresetInstanceSizeInput = Pick<
  WorkspacePresetContribution["instances"][number],
  "instanceId" | "contribution" | "size"
>

function resolvePresetInstanceSize(
  presetId: string,
  presetInstance: PresetInstanceSizeInput,
): Pick<PluginInstance, "size"> {
  const contributionKind = presetInstance.contribution.kind
  if (contributionKind !== "widget") {
    if (presetInstance.size !== undefined) {
      throw new Error(
        `Workspace preset "${presetId}" non-widget instance "${presetInstance.instanceId}" must not declare size`,
      )
    }
    return {}
  }

  if (!presetInstance.size) {
    throw new Error(
      `Workspace preset "${presetId}" widget instance "${presetInstance.instanceId}" must declare size`,
    )
  }

  return { size: presetInstance.size }
}

function resolvePresetInstanceId(workspaceId: string, instanceId: string): string {
  if (workspaceId === "default") return instanceId
  return `${workspaceId}:${instanceId}`
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
    const resolvedInstanceId = resolvePresetInstanceId(
      options.workspaceId,
      presetInstance.instanceId,
    )
    const region = regions[presetInstance.regionId]
    if (!region) {
      throw new Error(
        `Workspace preset "${options.preset.id}" instance "${presetInstance.instanceId}" targets unknown region "${presetInstance.regionId}"`,
      )
    }
    const contributionKind = presetInstance.contribution.kind
    if (!region.accepts.includes(contributionKind)) {
      throw new Error(
        `Workspace preset "${options.preset.id}" instance "${presetInstance.instanceId}" uses contribution kind "${contributionKind}" incompatible with region "${presetInstance.regionId}"`,
      )
    }

    region.instances.push({ instanceId: resolvedInstanceId })
    instances.push({
      id: resolvedInstanceId,
      workspaceId: options.workspaceId,
      contribution: presetInstance.contribution,
      regionId: presetInstance.regionId,
      enabled: true,
      ...resolvePresetInstanceSize(options.preset.id, presetInstance),
      config: cloneJsonValue(presetInstance.config ?? {}),
      createdAt: now,
      updatedAt: now,
    })
  }

  return {
    workspace: {
      id: options.workspaceId,
      name: options.workspaceName ?? options.preset.title,
      activeLayout: options.preset.layout,
      activeTheme: options.preset.theme,
      activeBackgroundProvider: options.preset.backgroundProvider,
      config: {
        search: {
          defaultProvider: options.preset.search.defaultProvider,
          enabledProviders: [...options.preset.search.enabledProviders],
        },
      },
      regions,
      createdAt: now,
      updatedAt: now,
    },
    instances,
  }
}
