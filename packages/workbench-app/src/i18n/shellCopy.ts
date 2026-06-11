import type { SettingsHostCopy, SettingsSectionId } from "@tabora/workbench-shell"

export type ShellTranslation = (key: string, vars?: Record<string, string | number>) => string

export type WorkbenchShellCommandPaletteCopy = {
  placeholder: string
  empty: string
}

export type WorkbenchShellWidgetCopy = {
  removeAriaLabel: (title: string) => string
}

export type WorkbenchShellPluginViewBoundaryCopy = {
  loadFailed: string
  retry: string
}

export function createWorkbenchShellSettingsHostCopy(t: ShellTranslation): SettingsHostCopy {
  const sectionTitle = (sectionId: SettingsSectionId) => {
    if (sectionId === "general") return t("settingsHost.section.general")
    if (sectionId === "appearance") return t("settingsHost.section.appearance")
    if (sectionId === "search") return t("settingsHost.section.search")
    if (sectionId === "about") return t("settingsHost.section.about")
    return t("settingsHost.group.plugins")
  }

  return {
    sidebarTitle: t("settingsHost.sidebarTitle"),
    pluginGroupTitle: t("settingsHost.group.plugins"),
    pluginInstalledNav: t("settingsHost.plugins.installed"),
    pluginsActiveTitle: t("settingsHost.title.plugins"),
    closeAriaLabel: t("settingsHost.closeAriaLabel"),
    aboutUnavailable: t("settingsHost.aboutUnavailable"),
    emptySection: t("settingsHost.emptySection"),
    panelMissing: (panelId: string) => t("settingsHost.panelMissing", { panelId }),
    sectionTitle,
  }
}

export function createWorkbenchShellCommandPaletteCopy(
  t: ShellTranslation,
): WorkbenchShellCommandPaletteCopy {
  return {
    placeholder: t("commandPalette.placeholder"),
    empty: t("commandPalette.empty"),
  }
}

export function createWorkbenchShellWidgetCopy(t: ShellTranslation): WorkbenchShellWidgetCopy {
  return {
    removeAriaLabel: (title: string) => t("widget.removeAriaLabel", { title }),
  }
}

export function createWorkbenchShellPluginViewBoundaryCopy(
  t: ShellTranslation,
): WorkbenchShellPluginViewBoundaryCopy {
  return {
    get loadFailed() {
      return t("pluginView.loadFailed")
    },
    get retry() {
      return t("pluginView.retry")
    },
  }
}
