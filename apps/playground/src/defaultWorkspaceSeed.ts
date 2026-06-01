import type { PluginInstance, WidgetSize, Workspace } from "@tabora/plugin-api"

export type WorkspaceSeedInstance = {
  pluginId: string
  contributionId: string
  instanceId: string
  extensionPoint: PluginInstance["extensionPoint"]
  regionId: PluginInstance["regionId"]
  size?: WidgetSize
}

export type WorkspaceSeedConfig = {
  workspaceId?: string
  workspaceName: string
  activeLayoutId: string
  activeThemeId: string
  defaultBackgroundProviderId: string
  instances: WorkspaceSeedInstance[]
}

export function createDefaultWorkspaceSeed(config: WorkspaceSeedConfig): {
  workspace: Workspace
  instances: PluginInstance[]
} {
  const now = new Date().toISOString()

  const workspace: Workspace = {
    id: config.workspaceId ?? "default",
    name: config.workspaceName,
    activeLayoutId: config.activeLayoutId,
    activeThemeId: config.activeThemeId,
    activeBackgroundProviderId: config.defaultBackgroundProviderId,
    regions: {
      rail: {
        regionId: "rail",
        accepts: ["layout"],
        instances: config.instances
          .filter((i) => i.regionId === "rail")
          .map((i) => ({ instanceId: i.instanceId })),
      },
      topbar: {
        regionId: "topbar",
        accepts: ["search"],
        instances: config.instances
          .filter((i) => i.regionId === "topbar")
          .map((i) => ({ instanceId: i.instanceId })),
      },
      mainGrid: {
        regionId: "mainGrid",
        accepts: ["widget"],
        instances: config.instances
          .filter((i) => i.regionId === "mainGrid")
          .map((i) => ({ instanceId: i.instanceId })),
      },
    },
    createdAt: now,
    updatedAt: now,
  }

  const instances: PluginInstance[] = config.instances.map((i) => ({
    id: i.instanceId,
    workspaceId: workspace.id,
    pluginId: i.pluginId,
    contributionId: i.contributionId,
    extensionPoint: i.extensionPoint,
    regionId: i.regionId,
    enabled: true,
    size: i.size ?? "M",
    config: {},
    createdAt: now,
    updatedAt: now,
  }))

  return { workspace, instances }
}

export const OFFICIAL_DEFAULT_WORKSPACE_SEED: WorkspaceSeedConfig = {
  workspaceName: "默认工作区",
  activeLayoutId: "official.layout.workbench-dashboard",
  activeThemeId: "official.theme.light",
  defaultBackgroundProviderId: "background.gradient-green",
  instances: [
    {
      pluginId: "official.search.command-bar",
      contributionId: "official.search.command-bar",
      instanceId: "search-main",
      extensionPoint: "search",
      regionId: "topbar",
    },
    {
      pluginId: "official.widgets.today-focus",
      contributionId: "today-focus",
      instanceId: "today-focus-1",
      extensionPoint: "widget",
      regionId: "mainGrid",
      size: "M",
    },
    {
      pluginId: "official.widgets.quick-links",
      contributionId: "quick-links",
      instanceId: "quick-links-1",
      extensionPoint: "widget",
      regionId: "mainGrid",
      size: "M",
    },
    {
      pluginId: "official.widgets.notes",
      contributionId: "notes",
      instanceId: "notes-1",
      extensionPoint: "widget",
      regionId: "mainGrid",
      size: "M",
    },
    {
      pluginId: "official.widgets.todo",
      contributionId: "todo",
      instanceId: "todo-1",
      extensionPoint: "widget",
      regionId: "mainGrid",
      size: "M",
    },
  ],
}
