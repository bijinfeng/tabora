export type WorkbenchShellConfig = {
  themeIds: {
    light: string
    dark: string
  }
  layoutIds: {
    dashboard: string
  }
  settingsPanelIds: {
    appearance: string
    plugins?: string
  }
  searchHistory: {
    pluginId: string
    key: string
  }
  auth?: {
    apiBaseUrl: string
  }
}

export function resolveWorkbenchThemeToggleTarget(
  isDark: boolean,
  themeIds: WorkbenchShellConfig["themeIds"],
): string {
  return isDark ? themeIds.light : themeIds.dark
}

export function isWorkbenchDarkTheme(
  themeId: string,
  darkThemeId: WorkbenchShellConfig["themeIds"]["dark"],
): boolean {
  return themeId === darkThemeId
}
