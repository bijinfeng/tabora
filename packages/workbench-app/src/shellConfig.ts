export type WorkbenchShellConfig = {
  themeIds: {
    light: string
    dark: string
  }
  layoutIds: {
    dashboard: string
    stream: string
  }
  settingsPanelIds: {
    appearance: string
  }
  searchHistory: {
    pluginId: string
    key: string
  }
}

export function resolveWorkbenchThemeToggleTarget(
  isDark: boolean,
  themeIds: WorkbenchShellConfig["themeIds"],
): string {
  return isDark ? themeIds.light : themeIds.dark
}

export function resolveWorkbenchLayoutToggleTarget(
  activeLayoutId: string,
  layoutIds: WorkbenchShellConfig["layoutIds"],
): string {
  return activeLayoutId === layoutIds.dashboard ? layoutIds.stream : layoutIds.dashboard
}

export function isWorkbenchDarkTheme(
  themeId: string,
  darkThemeId: WorkbenchShellConfig["themeIds"]["dark"],
): boolean {
  return themeId === darkThemeId
}
