export { officialDefaultWorkspacePreset as builtinDefaultWorkspacePreset } from "@tabora/official-plugins/workspace-default-preset"

export const builtinWorkbenchShellConfig = {
  themeIds: {
    light: "official.theme.light",
    dark: "official.theme.dark",
  },
  layoutIds: {
    dashboard: "official.layout.workbench-dashboard",
    focus: "official.layout.workbench-focus",
    mobile: "official.layout.workbench-mobile",
  },
  settingsPanelIds: {
    appearance: "official.settings.workspace.appearance",
    plugins: "official.settings.plugins",
  },
  searchHistory: {
    pluginId: "official.search.command-bar",
    key: "search-history",
  },
} as const
