import type { PluginInstance } from "@tabora/plugin-api"

import type { WorkspaceSessionState } from "./workspaceSession"

export async function hydrateWorkbenchSessionState(options: {
  session: WorkspaceSessionState
  setWorkspaceState: (workspace: WorkspaceSessionState["workspace"]) => void
  setActiveLayoutId: (layoutId: string) => void
  setSearchSettings: (settings: WorkspaceSessionState["searchSettings"]) => void
  setSearchHistory: (history: WorkspaceSessionState["searchHistory"]) => void
  setInstances: (instances: PluginInstance[]) => void
  applyThemeSelection: (themeId: string) => void
  applyBackgroundSelection: (backgroundId: string) => void
  reconcileInstancesForLayout: (
    layoutId: string,
    currentInstances: PluginInstance[],
  ) => Promise<{ instances: PluginInstance[] }>
}) {
  options.setWorkspaceState(options.session.workspace)
  options.setActiveLayoutId(options.session.activeLayoutId)
  options.applyThemeSelection(options.session.activeThemeId)
  options.applyBackgroundSelection(options.session.activeBackgroundId)
  options.setSearchSettings(options.session.searchSettings)
  options.setSearchHistory(options.session.searchHistory)
  const { instances } = await options.reconcileInstancesForLayout(
    options.session.activeLayoutId,
    options.session.instances,
  )
  options.setInstances(instances)
}
