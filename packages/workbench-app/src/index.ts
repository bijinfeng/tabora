import type { PluginInstance, WorkbenchSearchSettings, Workspace } from "@tabora/plugin-api"
import type { HostAdapter } from "@tabora/host-adapters"

export * from "./bootstrap"

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
  defaultProviderId: "",
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
