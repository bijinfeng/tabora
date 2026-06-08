import { applyWorkspacePreset } from "@tabora/orchestrator"
import type { PluginInstance, Workspace, WorkspacePresetContribution } from "@tabora/plugin-api"

export function createDefaultWorkspaceFromPreset(options: {
  preset: WorkspacePresetContribution
  workspaceId?: string
  workspaceName?: string
}): {
  workspace: Workspace
  instances: PluginInstance[]
} {
  const workspaceName = options.workspaceName
  return applyWorkspacePreset({
    preset: options.preset,
    workspaceId: options.workspaceId ?? "default",
    ...(workspaceName ? { workspaceName } : {}),
  })
}
