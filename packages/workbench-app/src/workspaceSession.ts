import type {
  PluginInstance,
  SearchHistoryEntry,
  WorkbenchSearchSettings,
  Workspace,
} from "@tabora/plugin-api"
import { workbenchSearchSettingsSchema } from "@tabora/plugin-api"
import type { InstanceRepository, PluginDataRepository, WorkspaceRepository } from "@tabora/storage"

import { createDefaultWorkspaceFromPreset } from "./defaultWorkspaceSeed"

export type WorkspaceSessionState = {
  workspace: Workspace
  instances: PluginInstance[]
  searchHistory: SearchHistoryEntry[]
  searchSettings: WorkbenchSearchSettings
  activeLayoutId: string
  activeThemeId: string
  activeBackgroundId: string
}

export function readSearchSettings(workspace: Workspace): WorkbenchSearchSettings {
  const parsed = workbenchSearchSettingsSchema.safeParse(workspace.config?.search)
  if (!parsed.success) {
    throw new Error("Workspace search settings are invalid")
  }

  return parsed.data
}

export async function ensureWorkspaceSession(options: {
  workspaceRepo: WorkspaceRepository
  instanceRepo: InstanceRepository
  pluginDataRepo: PluginDataRepository
  workspaceId?: string
}): Promise<WorkspaceSessionState> {
  let workspace = await options.workspaceRepo.get(options.workspaceId ?? "default")
  let instances: PluginInstance[] = []
  if (!workspace) {
    const seed = createDefaultWorkspaceFromPreset({})
    workspace = seed.workspace
    instances = seed.instances
    await options.workspaceRepo.save(workspace)
    for (const instance of instances) {
      await options.instanceRepo.save(instance)
    }
  } else {
    instances = await options.instanceRepo.getByWorkspace(workspace.id)
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
    searchSettings: readSearchSettings(workspace),
    activeLayoutId: workspace.activeLayoutId,
    activeThemeId: workspace.activeThemeId,
    activeBackgroundId: workspace.activeBackgroundProviderId,
  }
}

export async function createWorkspaceSession(options: {
  workspaceRepo: WorkspaceRepository
  instanceRepo: InstanceRepository
  name: string
}): Promise<Workspace> {
  const seed = createDefaultWorkspaceFromPreset({
    workspaceId: `ws-${Date.now()}`,
    workspaceName: options.name,
  })
  const workspace = { ...seed.workspace, updatedAt: new Date().toISOString() }

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

export async function updateWorkspaceRecord(options: {
  workspaceRepo: WorkspaceRepository
  workspaceId: string
  mutator: (workspace: Workspace) => Workspace
}): Promise<Workspace | null> {
  const current = await options.workspaceRepo.get(options.workspaceId)
  if (!current) return null
  const updated = options.mutator({ ...current, config: { ...(current.config ?? {}) } })
  updated.updatedAt = new Date().toISOString()
  await options.workspaceRepo.save(updated)
  return updated
}

export async function updateWorkspaceTheme(options: {
  workspaceRepo: WorkspaceRepository
  workspaceId: string
  themeId: string
}): Promise<Workspace | null> {
  return updateWorkspaceRecord({
    workspaceRepo: options.workspaceRepo,
    workspaceId: options.workspaceId,
    mutator(workspace) {
      workspace.activeThemeId = options.themeId
      return workspace
    },
  })
}

export async function updateWorkspaceBackground(options: {
  workspaceRepo: WorkspaceRepository
  workspaceId: string
  backgroundId: string
}): Promise<Workspace | null> {
  return updateWorkspaceRecord({
    workspaceRepo: options.workspaceRepo,
    workspaceId: options.workspaceId,
    mutator(workspace) {
      workspace.activeBackgroundProviderId = options.backgroundId
      return workspace
    },
  })
}

export async function updateWorkspaceLayout(options: {
  workspaceRepo: WorkspaceRepository
  workspaceId: string
  layoutId: string
}): Promise<Workspace | null> {
  return updateWorkspaceRecord({
    workspaceRepo: options.workspaceRepo,
    workspaceId: options.workspaceId,
    mutator(workspace) {
      workspace.activeLayoutId = options.layoutId
      return workspace
    },
  })
}

export function resolveWorkspaceVisualState(workspace: Workspace): {
  activeLayoutId: string
  activeThemeId: string
  activeBackgroundId: string
} {
  return {
    activeLayoutId: workspace.activeLayoutId,
    activeThemeId: workspace.activeThemeId,
    activeBackgroundId: workspace.activeBackgroundProviderId,
  }
}
