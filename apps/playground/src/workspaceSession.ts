import type {
  BackgroundProviderContribution,
  PluginInstance,
  SearchHistoryEntry,
  SearchProviderContribution,
  ThemeContribution,
  WorkbenchSearchSettings,
  Workspace,
} from "@tabora/plugin-api"
import type { InstanceRepository, PluginDataRepository, WorkspaceRepository } from "@tabora/storage"
import { createDefaultWorkspaceSeed, OFFICIAL_DEFAULT_WORKSPACE_SEED } from "./defaultWorkspaceSeed"
import { FALLBACK_BACKGROUND_ID } from "./backgroundResolver"

export type WorkspaceSessionState = {
  workspace: Workspace
  instances: PluginInstance[]
  searchHistory: SearchHistoryEntry[]
  searchSettings: WorkbenchSearchSettings
  activeLayoutId: string
  activeThemeId: string
  activeBackgroundId: string
}

export function readSearchSettings(
  workspace: Workspace,
  providers: SearchProviderContribution[],
): WorkbenchSearchSettings {
  const saved = workspace.config?.search as Record<string, unknown> | undefined
  const defaultProviderId =
    typeof saved?.defaultProviderId === "string"
      ? saved.defaultProviderId
      : (providers[0]?.id ?? "")

  let enabledProviderIds: string[] | undefined
  if (Array.isArray(saved?.enabledProviderIds)) {
    enabledProviderIds = saved.enabledProviderIds as string[]
  }

  const result: WorkbenchSearchSettings = { defaultProviderId }
  if (enabledProviderIds) {
    result.enabledProviderIds = enabledProviderIds
  }
  return result
}

export async function ensureWorkspaceSession(options: {
  workspaceRepo: WorkspaceRepository
  instanceRepo: InstanceRepository
  pluginDataRepo: PluginDataRepository
  searchProviders: SearchProviderContribution[]
  workspaceId?: string
}): Promise<WorkspaceSessionState> {
  let workspace = await options.workspaceRepo.get(options.workspaceId ?? "default")
  if (!workspace) {
    const seed = createDefaultWorkspaceSeed(OFFICIAL_DEFAULT_WORKSPACE_SEED)
    workspace = seed.workspace
    await options.workspaceRepo.save(workspace)
  }

  let instances = await options.instanceRepo.getByRegion(workspace.id, "mainGrid")
  if (instances.length === 0) {
    const seed = createDefaultWorkspaceSeed({
      ...OFFICIAL_DEFAULT_WORKSPACE_SEED,
      workspaceId: workspace.id,
      workspaceName: workspace.name,
      activeLayoutId: workspace.activeLayoutId,
      activeThemeId: workspace.activeThemeId,
      defaultBackgroundProviderId:
        workspace.activeBackgroundProviderId ??
        OFFICIAL_DEFAULT_WORKSPACE_SEED.defaultBackgroundProviderId,
    })
    instances = seed.instances.filter((instance) => instance.regionId === "mainGrid")
    for (const instance of instances) {
      await options.instanceRepo.save(instance)
    }
  }

  const searchHistory =
    (await options.pluginDataRepo.getByWorkspace<SearchHistoryEntry[]>(
      "official.search.command-bar",
      workspace.id,
      "search-history",
    )) ?? []

  return {
    workspace,
    instances,
    searchHistory,
    searchSettings: readSearchSettings(workspace, options.searchProviders),
    activeLayoutId: workspace.activeLayoutId,
    activeThemeId: workspace.activeThemeId,
    activeBackgroundId: workspace.activeBackgroundProviderId ?? FALLBACK_BACKGROUND_ID,
  }
}

export async function createWorkspaceSession(options: {
  workspaceRepo: WorkspaceRepository
  instanceRepo: InstanceRepository
  name: string
}): Promise<Workspace> {
  const seed = createDefaultWorkspaceSeed({
    ...OFFICIAL_DEFAULT_WORKSPACE_SEED,
    workspaceId: `ws-${Date.now()}`,
    workspaceName: options.name,
  })
  const workspace = {
    ...seed.workspace,
    updatedAt: new Date().toISOString(),
  }

  await options.workspaceRepo.save(workspace)
  for (const instance of seed.instances) {
    await options.instanceRepo.save({ ...instance, workspaceId: workspace.id })
  }

  return workspace
}

export async function deleteWorkspaceSession(options: {
  workspaceRepo: WorkspaceRepository
  instanceRepo: InstanceRepository
  pluginDataRepo: PluginDataRepository
  workspaceId: string
}): Promise<void> {
  if (options.workspaceId === "default") return
  await options.instanceRepo.removeByWorkspace(options.workspaceId)
  await options.pluginDataRepo.removeByWorkspace(options.workspaceId)
  await options.workspaceRepo.remove(options.workspaceId)
}

export function resolveWorkspaceVisualState(options: {
  workspace: Workspace
  themes: ThemeContribution[]
  backgrounds: BackgroundProviderContribution[]
}): {
  activeLayoutId: string
  activeThemeId: string
  activeBackgroundId: string
} {
  return {
    activeLayoutId: options.workspace.activeLayoutId,
    activeThemeId: options.workspace.activeThemeId,
    activeBackgroundId: options.workspace.activeBackgroundProviderId ?? FALLBACK_BACKGROUND_ID,
  }
}
