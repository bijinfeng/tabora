import type { SettingsPanelViewProps, Workspace } from "@tabora/plugin-api"
import {
  resolveInitialSettingsSectionId,
  type SettingsPanelDescriptor,
  type SettingsSectionId,
} from "@tabora/workbench-shell"

import { requireWorkspace } from "../shared/WorkbenchShellUtils"

export function openWorkbenchSettings(
  options: {
    panels: SettingsPanelDescriptor[]
    setActiveSettingsSectionId: (sectionId: SettingsSectionId) => void
    setSettingsOpen: (open: boolean) => void
  },
  panelId?: string,
) {
  options.setActiveSettingsSectionId(resolveInitialSettingsSectionId(options.panels, panelId))
  options.setSettingsOpen(true)
}

export function buildWorkbenchSettingsPanelProps(
  panel: SettingsPanelDescriptor,
  options: {
    workspace: Workspace | null
    workspaces: Workspace[]
    layouts: SettingsPanelViewProps["layouts"]
    themes: SettingsPanelViewProps["themes"]
    backgrounds: SettingsPanelViewProps["backgrounds"]
    searchProviders: SettingsPanelViewProps["searchProviders"]
    searchSettings: SettingsPanelViewProps["searchSettings"]
    plugins: SettingsPanelViewProps["plugins"]
    locale: SettingsPanelViewProps["locale"]
    availableLocales: SettingsPanelViewProps["availableLocales"]
    host: SettingsPanelViewProps["host"]
  },
): SettingsPanelViewProps {
  return {
    panelId: panel.id,
    pluginId: panel.pluginId,
    scope: panel.scope,
    ...(options.locale ? { locale: options.locale } : {}),
    ...(options.availableLocales ? { availableLocales: options.availableLocales } : {}),
    host: options.host,
    workspace: requireWorkspace(options.workspace),
    workspaces: options.workspaces,
    layouts: options.layouts,
    themes: options.themes,
    backgrounds: options.backgrounds,
    searchProviders: options.searchProviders,
    searchSettings: options.searchSettings,
    plugins: options.plugins,
  }
}

export function createWorkbenchSettingsPanelPropsBuilder(options: {
  getWorkspace: () => Workspace | null
  getWorkspaces: () => Workspace[]
  getLayouts: () => SettingsPanelViewProps["layouts"]
  getThemes: () => SettingsPanelViewProps["themes"]
  getBackgrounds: () => SettingsPanelViewProps["backgrounds"]
  getSearchProviders: () => SettingsPanelViewProps["searchProviders"]
  getSearchSettings: () => SettingsPanelViewProps["searchSettings"]
  getPlugins: () => SettingsPanelViewProps["plugins"]
  getLocale: () => SettingsPanelViewProps["locale"]
  getAvailableLocales: () => SettingsPanelViewProps["availableLocales"]
  host: SettingsPanelViewProps["host"]
}) {
  return (panel: SettingsPanelDescriptor): SettingsPanelViewProps =>
    buildWorkbenchSettingsPanelProps(panel, {
      workspace: options.getWorkspace(),
      workspaces: options.getWorkspaces(),
      layouts: options.getLayouts(),
      themes: options.getThemes(),
      backgrounds: options.getBackgrounds(),
      searchProviders: options.getSearchProviders(),
      searchSettings: options.getSearchSettings(),
      plugins: options.getPlugins(),
      locale: options.getLocale(),
      availableLocales: options.getAvailableLocales(),
      host: options.host,
    })
}
