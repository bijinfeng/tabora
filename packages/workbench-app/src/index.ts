import type {
  PluginInstance,
  WorkbenchSearchSettings,
  Workspace,
  WorkspacePresetContribution,
} from "@tabora/plugin-api"
import type { HostAdapter } from "@tabora/host-adapters"

export * from "./bootstrap"
export * from "./backgroundResolver"
export * from "./defaultWorkspaceSeed"
export * from "./layoutFallback"
export * from "./layoutEngine"
export * from "./pluginStyleManager"
export * from "./responsive"
export * from "./WorkbenchShellApp"
export * from "./shellController"
export * from "./shellConfig"
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
  defaultWorkspacePreset: WorkspacePresetContribution
  initialState?: Partial<WorkbenchCompositionState>
}

function deriveSearchSettingsFromPreset(
  preset: WorkspacePresetContribution,
): WorkbenchSearchSettings {
  return {
    defaultProviderId: preset.search.defaultProviderId,
    enabledProviderIds: [...preset.search.enabledProviderIds],
  }
}

export function createWorkbenchComposition(
  options: CreateWorkbenchCompositionOptions,
): WorkbenchComposition {
  return {
    host: options.host,
    initialState: {
      workspace: options.initialState?.workspace ?? null,
      instances: options.initialState?.instances ?? [],
      searchSettings:
        options.initialState?.searchSettings ??
        deriveSearchSettingsFromPreset(options.defaultWorkspacePreset),
    },
  }
}
