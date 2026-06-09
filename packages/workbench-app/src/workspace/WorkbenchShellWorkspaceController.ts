import type {
  BackgroundProviderContribution,
  LayoutContribution,
  PluginInstance,
  SearchHistoryEntry,
  SearchProviderContribution,
  ThemeContribution,
  ThemeTokenSet,
  WorkbenchSearchSettings,
  Workspace,
  WorkspacePresetContribution,
} from "@tabora/plugin-api"
import type { LayoutSwitchPlan } from "@tabora/orchestrator"

import {
  applyWorkbenchBackgroundSelection,
  applyWorkbenchThemeSelection,
  switchWorkbenchBackground,
  switchWorkbenchTheme,
} from "../appearance/WorkbenchShellAppearanceState"
import {
  reconcileWorkbenchLayoutInstances,
  switchWorkbenchLayout,
} from "../layout/WorkbenchShellLayoutState"
import {
  saveWorkbenchSearchHistory,
  setWorkbenchDefaultSearchProvider,
  setWorkbenchSearchProviderEnabled,
} from "../search/WorkbenchShellSearchState"
import { requireWorkspace } from "../shared/WorkbenchShellUtils"
import { createWorkbenchWorkspaceState } from "./WorkbenchShellWorkspaceState"
import type { WorkbenchShellConfig } from "../shared/shellConfig"
import { createLayoutSwitchExecution } from "../shared/shellController"
import {
  updateWorkspaceBackground,
  updateWorkspaceRecord,
  updateWorkspaceTheme,
} from "./workspaceSession"

type WorkspaceStateOptions = Parameters<typeof createWorkbenchWorkspaceState>[0]
type WorkspaceRepo = WorkspaceStateOptions["workspaceRepo"]
type InstanceRepo = WorkspaceStateOptions["instanceRepo"]
type PluginDataRepo = WorkspaceStateOptions["pluginDataRepo"]
type TaboraDatabase = WorkspaceStateOptions["database"]

type WorkspaceSnapshotRepo = {
  save: (snapshot: LayoutSwitchPlan["snapshot"]) => Promise<void>
}

type ThemeApplier = (tokens: ThemeTokenSet) => void
type BackgroundApplier = (style: Record<string, string>) => void
type SearchSettingsSetter = (
  updater:
    | WorkbenchSearchSettings
    | ((previous: WorkbenchSearchSettings) => WorkbenchSearchSettings),
) => void

export function createWorkbenchWorkspaceController(options: {
  workspaceRepo: WorkspaceRepo
  instanceRepo: InstanceRepo
  pluginDataRepo: PluginDataRepo
  workspaceSnapshotRepo: WorkspaceSnapshotRepo
  database: TaboraDatabase
  kernel: { setPluginEnabled: (pluginId: string, enabled: boolean) => Promise<void> }
  pluginCatalog: {
    pluginIds: () => string[]
    listThemes: () => ThemeContribution[]
    listBackgroundProviders: () => BackgroundProviderContribution[]
    listLayouts: () => LayoutContribution[]
    findLayoutContribution: (layoutId: string) => LayoutContribution | undefined
    listSearchProviders: () => SearchProviderContribution[]
  }
  getWorkspaceState: () => Workspace | null
  getInstances: () => PluginInstance[]
  getSearchSettings: () => WorkbenchSearchSettings
  getSearchHistory: () => SearchHistoryEntry[]
  setWorkspaceState: (workspace: Workspace) => void
  setWorkspaceList: WorkspaceStateOptions["setWorkspaceList"]
  setActiveLayoutId: (layoutId: string) => void
  setSearchSettings: SearchSettingsSetter
  setSearchHistory: (history: SearchHistoryEntry[]) => void
  setInstances: (instances: PluginInstance[]) => void
  setThemeId: (themeId: string) => void
  setBackgroundId: (backgroundId: string) => void
  applyTheme: ThemeApplier
  applyBackground: BackgroundApplier
  clearContextMenu: () => void
  clearExpandState: () => void
  defaultWorkspacePreset: WorkspacePresetContribution
  shellConfig: WorkbenchShellConfig
  assignGridOrder: (instances: PluginInstance[]) => PluginInstance[]
  syncPluginStyles?: () => Promise<void> | void
  warn?: (message: string) => void
}) {
  const warn = options.warn ?? console.warn

  const applyThemeSelection = (themeId: string) =>
    applyWorkbenchThemeSelection({
      themeId,
      themes: options.pluginCatalog.listThemes(),
      setThemeId: options.setThemeId,
      applyTheme: options.applyTheme,
    })

  const applyBackgroundSelection = (backgroundId: string) =>
    applyWorkbenchBackgroundSelection({
      backgroundId,
      backgrounds: options.pluginCatalog.listBackgroundProviders(),
      setBackgroundId: options.setBackgroundId,
      applyBackground: options.applyBackground,
    })

  async function reconcileInstancesForLayout(
    layoutId: string,
    currentInstances: PluginInstance[],
  ): Promise<{ instances: PluginInstance[]; plan: LayoutSwitchPlan | null }> {
    return reconcileWorkbenchLayoutInstances({
      layoutId,
      currentInstances,
      activeWorkspace: requireWorkspace(options.getWorkspaceState()),
      findLayout: (targetLayoutId) => options.pluginCatalog.findLayoutContribution(targetLayoutId),
      executeLayoutSwitch: ({ workspace, instances, targetLayout }) =>
        createLayoutSwitchExecution({
          workspace,
          instances,
          targetLayout,
          now: new Date().toISOString(),
        }),
      assignGridOrder: options.assignGridOrder,
      saveInstance: (instance) => options.instanceRepo.save(instance),
    })
  }

  const workspaceStateActions = createWorkbenchWorkspaceState({
    workspaceRepo: options.workspaceRepo,
    instanceRepo: options.instanceRepo,
    pluginDataRepo: options.pluginDataRepo,
    database: options.database,
    availablePluginIds: () => options.pluginCatalog.pluginIds(),
    getWorkspaceState: options.getWorkspaceState,
    setWorkspaceState: options.setWorkspaceState,
    setWorkspaceList: options.setWorkspaceList,
    setActiveLayoutId: options.setActiveLayoutId,
    setSearchSettings: options.setSearchSettings,
    setSearchHistory: options.setSearchHistory,
    setInstances: options.setInstances,
    applyThemeSelection,
    applyBackgroundSelection,
    reconcileInstancesForLayout,
    clearContextMenu: options.clearContextMenu,
    clearExpandState: options.clearExpandState,
    defaultWorkspacePreset: options.defaultWorkspacePreset,
    searchHistoryStorage: options.shellConfig.searchHistory,
  })

  async function switchLayout(layoutId: string) {
    await switchWorkbenchLayout({
      layoutId,
      activeWorkspace: requireWorkspace(options.getWorkspaceState()),
      currentInstances: options.getInstances(),
      findLayout: (targetLayoutId) => options.pluginCatalog.findLayoutContribution(targetLayoutId),
      reconcileInstances: reconcileInstancesForLayout,
      clearContextMenu: options.clearContextMenu,
      clearExpandState: options.clearExpandState,
      setInstances: options.setInstances,
      setActiveLayoutId: options.setActiveLayoutId,
      saveSnapshot: (snapshot) => options.workspaceSnapshotRepo.save(snapshot),
      persistWorkspaceLayout: (workspaceId, nextLayoutId, regions) =>
        updateWorkspaceRecord({
          workspaceRepo: options.workspaceRepo,
          workspaceId,
          mutator(workspace) {
            workspace.activeLayoutId = nextLayoutId
            workspace.regions = regions
            return workspace
          },
        }),
      setWorkspaceState: options.setWorkspaceState,
    })
  }

  async function updateWorkspace(mutator: (workspace: Workspace) => Workspace) {
    await workspaceStateActions.updateWorkspace(mutator)
  }

  async function setDefaultSearchProvider(providerId: string) {
    await setWorkbenchDefaultSearchProvider({
      providerId,
      providers: options.pluginCatalog.listSearchProviders(),
      updateWorkspace,
      setSearchSettings: options.setSearchSettings,
      warn,
    })
  }

  async function setSearchProviderEnabled(providerId: string, enabled: boolean) {
    await setWorkbenchSearchProviderEnabled({
      providerId,
      enabled,
      currentSettings: options.getSearchSettings(),
      providers: options.pluginCatalog.listSearchProviders(),
      updateWorkspace,
      setSearchSettings: options.setSearchSettings,
      warn,
    })
  }

  async function togglePluginEnabled(pluginId: string, enabled: boolean) {
    await options.kernel.setPluginEnabled(pluginId, enabled)
    await options.syncPluginStyles?.()
  }

  async function saveSearchHistory(entry: { query: string; providerId: string }) {
    const workspace = requireWorkspace(options.getWorkspaceState())
    await saveWorkbenchSearchHistory({
      workspaceId: workspace.id,
      history: options.getSearchHistory(),
      entry,
      storage: options.shellConfig.searchHistory,
      setSearchHistory: options.setSearchHistory,
      saveForWorkspace: (pluginId, workspaceId, key, value) =>
        options.pluginDataRepo.saveForWorkspace(pluginId, workspaceId, key, value),
    })
  }

  async function switchTheme(themeId: string) {
    await switchWorkbenchTheme({
      workspace: requireWorkspace(options.getWorkspaceState()),
      themeId,
      themes: options.pluginCatalog.listThemes(),
      setThemeId: options.setThemeId,
      applyTheme: options.applyTheme,
      persistTheme: (workspaceId, nextThemeId) =>
        updateWorkspaceTheme({
          workspaceRepo: options.workspaceRepo,
          workspaceId,
          themeId: nextThemeId,
        }),
      setWorkspaceState: options.setWorkspaceState,
    })
  }

  async function switchBackground(backgroundId: string) {
    await switchWorkbenchBackground({
      workspace: requireWorkspace(options.getWorkspaceState()),
      backgroundId,
      backgrounds: options.pluginCatalog.listBackgroundProviders(),
      setBackgroundId: options.setBackgroundId,
      applyBackground: options.applyBackground,
      persistBackground: (workspaceId, nextBackgroundId) =>
        updateWorkspaceBackground({
          workspaceRepo: options.workspaceRepo,
          workspaceId,
          backgroundId: nextBackgroundId,
        }),
      setWorkspaceState: options.setWorkspaceState,
    })
  }

  return {
    applyThemeSelection,
    applyBackgroundSelection,
    reconcileInstancesForLayout,
    switchLayout,
    updateWorkspace,
    setDefaultSearchProvider,
    setSearchProviderEnabled,
    togglePluginEnabled,
    saveSearchHistory,
    exportWorkspace: workspaceStateActions.exportWorkspace,
    importWorkspace: workspaceStateActions.importWorkspace,
    createWorkspace: workspaceStateActions.createWorkspace,
    switchWorkspace: workspaceStateActions.switchWorkspace,
    deleteWorkspace: workspaceStateActions.deleteWorkspace,
    switchTheme,
    switchBackground,
  }
}
