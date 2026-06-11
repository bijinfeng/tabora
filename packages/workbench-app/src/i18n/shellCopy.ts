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
