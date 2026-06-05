import { officialDefaultWorkspacePreset } from "@tabora/official-plugins"
import { applyWorkspacePreset } from "@tabora/orchestrator"
import type { PluginInstance, Workspace, WorkspacePresetContribution } from "@tabora/plugin-api"

export const OFFICIAL_DEFAULT_WORKSPACE_PRESET = officialDefaultWorkspacePreset

export function createDefaultWorkspaceFromPreset(options: {
  preset?: WorkspacePresetContribution
  workspaceId?: string
  workspaceName?: string
}): {
  workspace: Workspace
  instances: PluginInstance[]
} {
  const workspaceName = options.workspaceName
  return applyWorkspacePreset({
    preset: options.preset ?? OFFICIAL_DEFAULT_WORKSPACE_PRESET,
    workspaceId: options.workspaceId ?? "default",
    ...(workspaceName ? { workspaceName } : {}),
  })
}
