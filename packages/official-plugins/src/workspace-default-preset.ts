import type { PluginModule, WorkspacePresetContribution } from "@tabora/plugin-api/sdk"

export const officialDefaultWorkspacePreset: WorkspacePresetContribution = {
  id: "official.workspace.default",
  title: "默认工作区",
  plugins: [
    "official.theme.default-pack",
    "official.background.basic",
    "official.layout.workbench-dashboard",
    "official.search.command-bar",
    "official.search-providers.basic",
    "official.widgets.quick-links",
    "official.widgets.todo",
    "official.widgets.notes",
    "official.widgets.weather",
    "official.plugin-manager",
    "official.settings.workspace",
  ],
  layout: {
    pluginId: "official.layout.workbench-dashboard",
    kind: "layout",
    id: "official.layout.workbench-dashboard",
  },
  theme: {
    pluginId: "official.theme.default-pack",
    kind: "theme",
    id: "official.theme.light",
  },
  backgroundProvider: {
    pluginId: "official.background.basic",
    kind: "background-provider",
    id: "background.gradient-green",
  },
  search: {
    defaultProvider: {
      pluginId: "official.search-providers.basic",
      kind: "search-provider",
      id: "official.search.google",
    },
    enabledProviders: [
      "official.search.google",
      "official.search.bing",
      "official.search.baidu",
      "official.search.duckduckgo",
      "official.search.github",
    ].map((id) => ({
      pluginId: "official.search-providers.basic",
      kind: "search-provider" as const,
      id,
    })),
  },
  regions: [
    { regionId: "topbar", accepts: ["search"] },
    { regionId: "mainGrid", accepts: ["widget"] },
  ],
  instances: [
    {
      contribution: {
        pluginId: "official.search.command-bar",
        kind: "search",
        id: "official.search.command-bar",
      },
      instanceId: "search-main",
      regionId: "topbar",
    },
    {
      contribution: { pluginId: "official.widgets.quick-links", kind: "widget", id: "quick-links" },
      instanceId: "quick-links-1",
      regionId: "mainGrid",
      size: "M",
    },
    {
      contribution: { pluginId: "official.widgets.todo", kind: "widget", id: "todo" },
      instanceId: "todo-1",
      regionId: "mainGrid",
      size: "S",
    },
    {
      contribution: { pluginId: "official.widgets.notes", kind: "widget", id: "notes" },
      instanceId: "notes-1",
      regionId: "mainGrid",
      size: "L",
    },
    {
      contribution: { pluginId: "official.widgets.weather", kind: "widget", id: "weather" },
      instanceId: "weather-1",
      regionId: "mainGrid",
      size: "S",
    },
  ],
}

export const officialWorkspacePresetPack: PluginModule = {
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
  activate() {},
}
