import type { PluginInstance, Workspace } from "@tabora/plugin-api"

import { requireWorkspace } from "../shared/WorkbenchShellUtils"
import { hydrateWorkbenchSessionState } from "./WorkbenchShellSessionState"
import {
  createWorkspaceSession,
  deleteWorkspaceSession,
  ensureWorkspaceSession,
  readSearchSettings,
  updateWorkspaceRecord,
} from "./workspaceSession"
import { exportWorkspaceData, importWorkspaceData } from "./workspaceTransfer"

type WorkspaceRepo = Parameters<typeof ensureWorkspaceSession>[0]["workspaceRepo"]
type InstanceRepo = Parameters<typeof ensureWorkspaceSession>[0]["instanceRepo"]
type PluginDataRepo = Parameters<typeof ensureWorkspaceSession>[0]["pluginDataRepo"]
type TaboraDatabase = Parameters<typeof exportWorkspaceData>[0]["database"]

export function createWorkbenchWorkspaceState(options: {
  workspaceRepo: WorkspaceRepo
  instanceRepo: InstanceRepo
  pluginDataRepo: PluginDataRepo
  database: TaboraDatabase
  availablePluginIds: () => string[]
  getWorkspaceState: () => Workspace | null
  setWorkspaceState: (workspace: Workspace) => void
  setWorkspaceList: (updater: (prev: Workspace[]) => Workspace[]) => void
  setActiveLayoutId: (layoutId: string) => void
  setSearchSettings: (settings: ReturnType<typeof readSearchSettings>) => void
  setSearchHistory: Parameters<typeof hydrateWorkbenchSessionState>[0]["setSearchHistory"]
  setInstances: (instances: PluginInstance[]) => void
  applyThemeSelection: (themeId: string) => void
  applyBackgroundSelection: (backgroundId: string) => void
  reconcileInstancesForLayout: (
    layoutId: string,
    currentInstances: PluginInstance[],
  ) => Promise<{ instances: PluginInstance[] }>
  clearContextMenu: () => void
  clearExpandState: () => void
  defaultWorkspacePreset: Parameters<typeof createWorkspaceSession>[0]["defaultWorkspacePreset"]
  searchHistoryStorage: Parameters<typeof ensureWorkspaceSession>[0]["searchHistoryStorage"]
}) {
  const resetTransientShellState = () => {
    options.clearContextMenu()
    options.clearExpandState()
  }

  async function updateWorkspace(mutator: (workspace: Workspace) => Workspace) {
    const activeWorkspace = requireWorkspace(options.getWorkspaceState())
    const updated = await updateWorkspaceRecord({
      workspaceRepo: options.workspaceRepo,
      workspaceId: activeWorkspace.id,
      mutator,
    })
    if (updated) {
      options.setWorkspaceState(updated)
    }
  }

  async function exportWorkspace(): Promise<string> {
    return exportWorkspaceData({
      workspace: requireWorkspace(options.getWorkspaceState()),
      instanceRepo: options.instanceRepo,
      database: options.database,
    })
  }

  async function importWorkspace(json: string): Promise<{ warnings: string[] }> {
    const result = await importWorkspaceData({
      json,
      workspaceRepo: options.workspaceRepo,
      instanceRepo: options.instanceRepo,
      pluginDataRepo: options.pluginDataRepo,
      database: options.database,
      availablePluginIds: options.availablePluginIds(),
    })

    resetTransientShellState()
    options.setWorkspaceState(result.workspace)

    const { instances } = await options.reconcileInstancesForLayout(
      result.workspace.activeLayoutId,
      result.instances,
    )
    options.setInstances(instances)
    options.setActiveLayoutId(result.workspace.activeLayoutId)
    options.applyThemeSelection(result.workspace.activeThemeId)
    options.applyBackgroundSelection(result.workspace.activeBackgroundProviderId)
    options.setSearchSettings(readSearchSettings(result.workspace))
    options.setWorkspaceList((prev) => [...prev, result.workspace])

    return { warnings: result.warnings }
  }

  async function createWorkspace(name: string): Promise<Workspace> {
    const workspace = await createWorkspaceSession({
      workspaceRepo: options.workspaceRepo,
      instanceRepo: options.instanceRepo,
      defaultWorkspacePreset: options.defaultWorkspacePreset,
      name,
    })
    options.setWorkspaceList((prev) => [...prev, workspace])
    return workspace
  }

  async function switchWorkspace(id: string) {
    if (id === options.getWorkspaceState()?.id) {
      return
    }

    const session = await ensureWorkspaceSession({
      workspaceRepo: options.workspaceRepo,
      instanceRepo: options.instanceRepo,
      pluginDataRepo: options.pluginDataRepo,
      defaultWorkspacePreset: options.defaultWorkspacePreset,
      searchHistoryStorage: options.searchHistoryStorage,
      workspaceId: id,
    })

    resetTransientShellState()
    await hydrateWorkbenchSessionState({
      session,
      setWorkspaceState: options.setWorkspaceState,
      setActiveLayoutId: options.setActiveLayoutId,
      setSearchSettings: options.setSearchSettings,
      setSearchHistory: options.setSearchHistory,
      setInstances: options.setInstances,
      applyThemeSelection: options.applyThemeSelection,
      applyBackgroundSelection: options.applyBackgroundSelection,
      reconcileInstancesForLayout: options.reconcileInstancesForLayout,
    })
  }

  async function deleteWorkspace(id: string) {
    await deleteWorkspaceSession({
      workspaceRepo: options.workspaceRepo,
      instanceRepo: options.instanceRepo,
      pluginDataRepo: options.pluginDataRepo,
      workspaceId: id,
    })

    options.setWorkspaceList((prev) => prev.filter((workspace) => workspace.id !== id))

    if (options.getWorkspaceState()?.id !== id) {
      return
    }

    const fallback = await options.workspaceRepo.get("default")
    if (fallback) {
      await switchWorkspace("default")
    }
  }

  return {
    updateWorkspace,
    exportWorkspace,
    importWorkspace,
    createWorkspace,
    switchWorkspace,
    deleteWorkspace,
  }
}
