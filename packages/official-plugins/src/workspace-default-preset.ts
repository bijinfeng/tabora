import type { BuiltinPlugin } from "@tabora/platform-kernel"
import type { WorkspacePresetContribution } from "@tabora/plugin-api"

export const officialDefaultWorkspacePreset: WorkspacePresetContribution = {
  id: "official.workspace.default",
  title: "默认工作区",
  plugins: [
    "official.theme.default-pack",
    "official.background.basic",
    "official.layout.dashboard",
    "official.search.command-bar",
    "official.search-providers.basic",
    "official.widgets.today-focus",
    "official.widgets.quick-links",
    "official.widgets.todo",
    "official.widgets.notes",
    "official.widgets.weather",
    "official.plugin-manager",
    "official.settings.workspace",
  ],
  layoutId: "official.layout.workbench-dashboard",
  themeId: "official.theme.light",
  backgroundProviderId: "background.gradient-green",
  search: {
    defaultProviderId: "official.search.google",
    enabledProviderIds: [
      "official.search.google",
      "official.search.bing",
      "official.search.baidu",
      "official.search.duckduckgo",
      "official.search.github",
    ],
  },
  regions: [
    { regionId: "topbar", accepts: ["search"] },
    { regionId: "mainGrid", accepts: ["widget"] },
  ],
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
      pluginId: "official.widgets.todo",
      contributionId: "todo",
      instanceId: "todo-1",
      extensionPoint: "widget",
      regionId: "mainGrid",
      size: "S",
    },
    {
      pluginId: "official.widgets.notes",
      contributionId: "notes",
      instanceId: "notes-1",
      extensionPoint: "widget",
      regionId: "mainGrid",
      size: "L",
    },
    {
      pluginId: "official.widgets.weather",
      contributionId: "weather",
      instanceId: "weather-1",
      extensionPoint: "widget",
      regionId: "mainGrid",
      size: "S",
    },
    {
      pluginId: "official.plugin-manager",
      contributionId: "plugin-status",
      instanceId: "plugin-status-1",
      extensionPoint: "widget",
      regionId: "mainGrid",
      size: "S",
    },
  ],
}

export const officialWorkspacePresetPack: BuiltinPlugin = {
  manifest: {
    id: "official.workspace-presets",
    name: "官方工作区预设",
    version: "0.1.0",
    apiVersion: "1.0.0",
    entry: "builtin:official.workspace-presets",
    engine: { platform: "tabora" },
    contributes: {
      workspacePresets: [officialDefaultWorkspacePreset],
    },
  },
  enabled: true,
  activate() {},
}
