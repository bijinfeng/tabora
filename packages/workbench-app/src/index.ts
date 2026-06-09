import type {
  PluginInstance,
  WorkbenchSearchSettings,
  Workspace,
  WorkspacePresetContribution,
} from "@tabora/plugin-api"
import type { HostAdapter } from "@tabora/host-adapters"

export * from "./runtime/bootstrap"
export * from "./appearance/backgroundResolver"
export * from "./workspace/defaultWorkspaceSeed"
export * from "./layout/layoutFallback"
export * from "./layout/layoutEngine"
export * from "./shared/pluginStyleManager"
export * from "./shared/responsive"
export * from "./shell/WorkbenchShellApp"
export * from "./shared/shellController"
export * from "./shared/shellConfig"
export * from "./shared/shellHelpers"
export * from "./appearance/themeResolver"
export * from "./shared/workbenchGrid"
export * from "./workspace/workspacePortability"
export * from "./workspace/workspaceSession"
export * from "./workspace/workspaceTransfer"

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
