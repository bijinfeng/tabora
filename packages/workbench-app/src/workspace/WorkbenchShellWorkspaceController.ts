import type {
  BackgroundProviderContribution,
  BackgroundProviderContributionRef,
  BackgroundRendererContributionRef,
  PluginInstance,
  SearchHistoryEntry,
  SearchProviderContribution,
  SearchProviderContributionRef,
  ThemeContribution,
  ThemeContributionRef,
  ThemeTokenSet,
  WorkbenchSearchSettings,
  Workspace,
  WorkspacePresetContribution,
} from "@tabora/plugin-api"

import {
  applyWorkbenchBackgroundSelection,
  applyWorkbenchThemeSelection,
  switchWorkbenchBackground,
  switchWorkbenchTheme,
} from "../appearance/WorkbenchShellAppearanceState"
import {
  saveWorkbenchSearchHistory,
  setWorkbenchDefaultSearchProvider,
  setWorkbenchSearchProviderEnabled,
} from "../search/WorkbenchShellSearchState"
import { requireWorkspace } from "../shared/WorkbenchShellUtils"
import { createWorkbenchWorkspaceState } from "./WorkbenchShellWorkspaceState"
import type { WorkbenchShellConfig } from "../shared/shellConfig"
import {
  updateWorkspaceBackground,
  updateWorkspaceBackgroundRenderer,
  updateWorkspaceLocale,
  updateWorkspaceTheme,
} from "./workspaceSession"
import type { WorkbenchLocale } from "../i18n"

type WorkspaceStateOptions = Parameters<typeof createWorkbenchWorkspaceState>[0]
type WorkspaceRepo = WorkspaceStateOptions["workspaceRepo"]
type InstanceRepo = WorkspaceStateOptions["instanceRepo"]
type PluginDataRepo = WorkspaceStateOptions["pluginDataRepo"]
type TaboraDatabase = WorkspaceStateOptions["database"]

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
  database?: TaboraDatabase
  kernel: {
    setPluginEnabled: (pluginId: string, enabled: boolean) => Promise<void>
  }
  pluginCatalog: {
    pluginIds: () => string[]
    listThemes: () => Array<ThemeContribution & { ref: ThemeContributionRef }>
    listBackgroundProviders: () => Array<
      BackgroundProviderContribution & { ref: BackgroundProviderContributionRef }
    >
    listSearchProviders: () => Array<
      SearchProviderContribution & { ref: SearchProviderContributionRef }
    >
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
  i18n: { locale: () => WorkbenchLocale; setLocale: (locale: WorkbenchLocale) => void }
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

  const workspaceStateActions = createWorkbenchWorkspaceState({
    workspaceRepo: options.workspaceRepo,
    instanceRepo: options.instanceRepo,
    pluginDataRepo: options.pluginDataRepo,
    ...(options.database ? { database: options.database } : {}),
    availablePluginIds: () => options.pluginCatalog.pluginIds(),
    getWorkspaceState: options.getWorkspaceState,
    setWorkspaceState: options.setWorkspaceState,
    setWorkspaceList: options.setWorkspaceList,
    setLocale: (locale) => options.i18n.setLocale(locale),
    setActiveLayoutId: options.setActiveLayoutId,
    setSearchSettings: options.setSearchSettings,
    setSearchHistory: options.setSearchHistory,
    setInstances: options.setInstances,
    applyThemeSelection,
    applyBackgroundSelection,
    clearContextMenu: options.clearContextMenu,
    clearExpandState: options.clearExpandState,
    defaultWorkspacePreset: options.defaultWorkspacePreset,
    searchHistoryStorage: options.shellConfig.searchHistory,
  })

  async function updateWorkspace(mutator: (workspace: Workspace) => Workspace) {
    await workspaceStateActions.updateWorkspace(mutator)
  }

  async function setDefaultSearchProvider(provider: SearchProviderContributionRef) {
    await setWorkbenchDefaultSearchProvider({
      provider,
      providers: options.pluginCatalog.listSearchProviders(),
      updateWorkspace,
      setSearchSettings: options.setSearchSettings,
      warn,
    })
  }

  async function setSearchProviderEnabled(
    provider: SearchProviderContributionRef,
    enabled: boolean,
  ) {
    await setWorkbenchSearchProviderEnabled({
      provider,
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

  async function switchTheme(theme: ThemeContributionRef) {
    await switchWorkbenchTheme({
      workspace: requireWorkspace(options.getWorkspaceState()),
      theme,
      themes: options.pluginCatalog.listThemes(),
      setThemeId: options.setThemeId,
      applyTheme: options.applyTheme,
      persistTheme: (workspaceId, nextTheme) =>
        updateWorkspaceTheme({
          workspaceRepo: options.workspaceRepo,
          workspaceId,
          theme: nextTheme,
        }),
      setWorkspaceState: options.setWorkspaceState,
    })
  }

  async function switchBackground(background: BackgroundProviderContributionRef) {
    await switchWorkbenchBackground({
      workspace: requireWorkspace(options.getWorkspaceState()),
      background,
      backgrounds: options.pluginCatalog.listBackgroundProviders(),
      setBackgroundId: options.setBackgroundId,
      applyBackground: options.applyBackground,
      persistBackground: (workspaceId, nextBackground) =>
        updateWorkspaceBackground({
          workspaceRepo: options.workspaceRepo,
          workspaceId,
          background: nextBackground,
        }),
      setWorkspaceState: options.setWorkspaceState,
    })
  }

  async function switchBackgroundRenderer(renderer: BackgroundRendererContributionRef | null) {
    const workspace = requireWorkspace(options.getWorkspaceState())
    const updated = await updateWorkspaceBackgroundRenderer({
      workspaceRepo: options.workspaceRepo,
      workspaceId: workspace.id,
      renderer,
    })
    if (updated) {
      options.setWorkspaceState(updated)
    }
  }

  async function switchLocale(locale: WorkbenchLocale) {
    options.i18n.setLocale(locale)
    const workspace = requireWorkspace(options.getWorkspaceState())
    const updated = await updateWorkspaceLocale({
      workspaceRepo: options.workspaceRepo,
      workspaceId: workspace.id,
      locale,
    })
    if (updated) {
      options.setWorkspaceState(updated)
    }
  }

  return {
    applyThemeSelection,
    applyBackgroundSelection,
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
    switchBackgroundRenderer,
    switchLocale,
  }
}
