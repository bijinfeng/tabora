import type { PluginInstance, WorkbenchSearchSettings, Workspace } from "@tabora/plugin-api"
import type { HostAdapter } from "@tabora/host-adapters"

import { OFFICIAL_DEFAULT_WORKSPACE_PRESET } from "./defaultWorkspaceSeed"

export * from "./bootstrap"
export * from "./backgroundResolver"
export * from "./defaultWorkspaceSeed"
export * from "./layoutFallback"
export * from "./responsive"
export * from "./WorkbenchShellApp"
export * from "./shellController"
export * from "./shellHelpers"
export * from "./themeResolver"
export * from "./workbenchGrid"
export * from "./workspacePortability"
export * from "./workspaceSession"
export * from "./workspaceTransfer"

export type WorkbenchCompositionState = {
  workspace: Workspace | null
  instances: PluginInstance[]
  searchSettings: WorkbenchSearchSettings
}

export type WorkbenchComposition = {
  host: HostAdapter
  initialState: WorkbenchCompositionState
}

export type CreateWorkbenchCompositionOptions = {
  host: HostAdapter
  initialState?: Partial<WorkbenchCompositionState>
}

const DEFAULT_SEARCH_SETTINGS: WorkbenchSearchSettings = {
  defaultProviderId: OFFICIAL_DEFAULT_WORKSPACE_PRESET.search.defaultProviderId,
  enabledProviderIds: [...OFFICIAL_DEFAULT_WORKSPACE_PRESET.search.enabledProviderIds],
}

export function createWorkbenchComposition(
  options: CreateWorkbenchCompositionOptions,
): WorkbenchComposition {
  return {
    host: options.host,
    initialState: {
      workspace: options.initialState?.workspace ?? null,
      instances: options.initialState?.instances ?? [],
      searchSettings: options.initialState?.searchSettings ?? DEFAULT_SEARCH_SETTINGS,
    },
  }
}
