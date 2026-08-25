import type {
  BackgroundProviderContributionRef,
  BackgroundRendererContributionRef,
  PluginInstance,
  SearchHistoryEntry,
  ThemeContributionRef,
  WorkbenchSearchSettings,
  Workspace,
} from "@tabora/plugin-api"
import { workbenchSearchSettingsSchema } from "@tabora/plugin-api"
import type { InstanceRepository, PluginDataRepository, WorkspaceRepository } from "@tabora/storage"

import { createDefaultWorkspaceFromPreset } from "./defaultWorkspaceSeed"
import type { WorkbenchLocale } from "../i18n"

export type WorkspaceSessionState = {
  workspace: Workspace
  instances: PluginInstance[]
  searchHistory: SearchHistoryEntry[]
  searchSettings: WorkbenchSearchSettings
  locale: WorkbenchLocale | null
  activeLayoutId: string
  activeThemeId: string
  activeBackgroundId: string
}

export function readSearchSettings(workspace: Workspace): WorkbenchSearchSettings {
  const parsed = workbenchSearchSettingsSchema.safeParse(workspace.config?.search)
  if (!parsed.success) {
    throw new Error("Workspace search settings are invalid")
  }

  return parsed.data as WorkbenchSearchSettings
}

export function readLocale(workspace: Workspace): WorkbenchLocale | null {
  const config = workspace.config
  if (!config || typeof config !== "object") return null
  const appearance = (config as Record<string, unknown>).appearance
  if (!appearance || typeof appearance !== "object") return null
  const locale = (appearance as Record<string, unknown>).locale
  if (locale === "zh-CN" || locale === "en-US") return locale
  return null
}

export async function ensureWorkspaceSession(options: {
  workspaceRepo: WorkspaceRepository
  instanceRepo: InstanceRepository
  pluginDataRepo: PluginDataRepository
  defaultWorkspacePreset: Parameters<typeof createDefaultWorkspaceFromPreset>[0]["preset"]
  searchHistoryStorage: {
    pluginId: string
    key: string
  }
  workspaceId?: string
}): Promise<WorkspaceSessionState> {
  const workspaceId = options.workspaceId ?? "default"
  let workspace = await options.workspaceRepo.get(workspaceId)
  let instances: PluginInstance[] = []
  if (!workspace) {
    const seed = createDefaultWorkspaceFromPreset({
      preset: options.defaultWorkspacePreset,
      workspaceId,
    })
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
      options.searchHistoryStorage.pluginId,
      workspace.id,
      options.searchHistoryStorage.key,
    )) ?? []

  return {
    workspace,
    instances,
    searchHistory,
    searchSettings: readSearchSettings(workspace),
    locale: readLocale(workspace),
    activeLayoutId: workspace.activeLayout.id,
    activeThemeId: workspace.activeTheme.id,
    activeBackgroundId: workspace.activeBackgroundProvider.id,
  }
}

export async function createWorkspaceSession(options: {
  workspaceRepo: WorkspaceRepository
  instanceRepo: InstanceRepository
  defaultWorkspacePreset: Parameters<typeof createDefaultWorkspaceFromPreset>[0]["preset"]
  name: string
}): Promise<Workspace> {
  const seed = createDefaultWorkspaceFromPreset({
    preset: options.defaultWorkspacePreset,
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
  theme: ThemeContributionRef
}): Promise<Workspace | null> {
  return updateWorkspaceRecord({
    workspaceRepo: options.workspaceRepo,
    workspaceId: options.workspaceId,
    mutator(workspace) {
      workspace.activeTheme = options.theme
      return workspace
    },
  })
}

export async function updateWorkspaceBackground(options: {
  workspaceRepo: WorkspaceRepository
  workspaceId: string
  background: BackgroundProviderContributionRef
}): Promise<Workspace | null> {
  return updateWorkspaceRecord({
    workspaceRepo: options.workspaceRepo,
    workspaceId: options.workspaceId,
    mutator(workspace) {
      workspace.activeBackgroundProvider = options.background
      return workspace
    },
  })
}

export async function updateWorkspaceBackgroundRenderer(options: {
  workspaceRepo: WorkspaceRepository
  workspaceId: string
  renderer: BackgroundRendererContributionRef | null
}): Promise<Workspace | null> {
  return updateWorkspaceRecord({
    workspaceRepo: options.workspaceRepo,
    workspaceId: options.workspaceId,
    mutator(workspace) {
      if (options.renderer === null) {
        delete workspace.activeBackgroundRenderer
      } else {
        workspace.activeBackgroundRenderer = options.renderer
      }
      return workspace
    },
  })
}

export async function updateWorkspaceLocale(options: {
  workspaceRepo: WorkspaceRepository
  workspaceId: string
  locale: WorkbenchLocale
}): Promise<Workspace | null> {
  return updateWorkspaceRecord({
    workspaceRepo: options.workspaceRepo,
    workspaceId: options.workspaceId,
    mutator(workspace) {
      const config = (workspace.config ?? {}) as Record<string, unknown>
      const appearance = (config.appearance ?? {}) as Record<string, unknown>
      appearance.locale = options.locale
      config.appearance = appearance
      workspace.config = config
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
    activeLayoutId: workspace.activeLayout.id,
    activeThemeId: workspace.activeTheme.id,
    activeBackgroundId: workspace.activeBackgroundProvider.id,
  }
}
