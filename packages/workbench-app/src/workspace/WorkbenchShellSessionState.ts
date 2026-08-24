import type { PluginInstance } from "@tabora/plugin-api"

import type { WorkspaceSessionState } from "./workspaceSession"

export async function hydrateWorkbenchSessionState(options: {
  session: WorkspaceSessionState
  setWorkspaceState: (workspace: WorkspaceSessionState["workspace"]) => void
  setLocale: (locale: NonNullable<WorkspaceSessionState["locale"]>) => void
  setActiveLayoutId: (layoutId: string) => void
  setSearchSettings: (settings: WorkspaceSessionState["searchSettings"]) => void
  setSearchHistory: (history: WorkspaceSessionState["searchHistory"]) => void
  setInstances: (instances: PluginInstance[]) => void
  applyThemeSelection: (themeId: string) => void
  applyBackgroundSelection: (backgroundId: string) => void
}) {
  options.setWorkspaceState(options.session.workspace)
  if (options.session.locale) {
    options.setLocale(options.session.locale)
  }
  options.setActiveLayoutId(options.session.activeLayoutId)
  options.applyThemeSelection(options.session.activeThemeId)
  options.applyBackgroundSelection(options.session.activeBackgroundId)
  options.setSearchSettings(options.session.searchSettings)
  options.setSearchHistory(options.session.searchHistory)
  options.setInstances(options.session.instances)
}
