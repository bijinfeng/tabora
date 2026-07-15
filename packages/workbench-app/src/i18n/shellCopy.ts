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
    if (sectionId === "account") return t("settingsHost.section.account")
    if (sectionId === "ai") return t("settingsHost.section.ai")
    if (sectionId === "sync") return t("settingsHost.section.sync")
    if (sectionId === "about") return t("settingsHost.section.about")
    return t("settingsHost.group.plugins")
  }
  const sectionDescription = (sectionId: SettingsSectionId) => {
    if (sectionId === "general") return t("settingsHost.section.general.description")
    if (sectionId === "appearance") return t("settingsHost.section.appearance.description")
    if (sectionId === "search") return t("settingsHost.section.search.description")
    if (sectionId === "account") return t("settingsHost.section.account.description")
    if (sectionId === "ai") return t("settingsHost.section.ai.description")
    if (sectionId === "sync") return t("settingsHost.section.sync.description")
    if (sectionId === "about") return t("settingsHost.section.about.description")
    return t("settingsHost.section.plugins.description")
  }
  const sectionMeta = (sectionId: SettingsSectionId) => {
    if (sectionId === "general") return t("settingsHost.section.general.meta")
    if (sectionId === "appearance") return t("settingsHost.section.appearance.meta")
    if (sectionId === "search") return t("settingsHost.section.search.meta")
    if (sectionId === "account") return t("settingsHost.section.account.meta")
    if (sectionId === "ai") return t("settingsHost.section.ai.meta")
    if (sectionId === "sync") return t("settingsHost.section.sync.meta")
    if (sectionId === "about") return t("settingsHost.section.about.meta")
    return t("settingsHost.section.plugins.meta")
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
    sectionDescription,
    sectionMeta,
    workspaceGroupTitle: t("settingsHost.group.workspace"),
    extensionGroupTitle: t("settingsHost.group.extensions"),
    accountNavName: t("settingsHost.account.navName"),
    accountNavMeta: t("settingsHost.account.navMeta"),
    accountNavAvatar: t("settingsHost.account.navAvatar"),
    windowSubtitle: t("settingsHost.windowSubtitle"),
    statusReady: t("settingsHost.status.ready"),
    statusSectionChanged: (sectionTitleText: string) =>
      t("settingsHost.status.sectionChanged", { sectionTitle: sectionTitleText }),
    statusReset: t("settingsHost.status.reset"),
    statusSaved: t("settingsHost.status.saved"),
    resetLabel: t("settingsHost.action.reset"),
    cancelLabel: t("settingsHost.action.cancel"),
    saveLabel: t("settingsHost.action.save"),
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
