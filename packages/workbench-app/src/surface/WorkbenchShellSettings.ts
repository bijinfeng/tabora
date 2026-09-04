import type {
  SettingsHostActionId,
  SettingsHostReadId,
  AiSettingsService,
  SettingsPanelData,
  SettingsPanelViewProps,
  SettingsSurface,
  SettingsWorkspaceSummary,
  Workspace,
} from "@tabora/plugin-api"
import {
  resolveInitialSettingsSectionId,
  type SettingsPanelDescriptor,
  type SettingsSectionId,
} from "@tabora/workbench-shell"

import { requireWorkspace } from "../shared/WorkbenchShellUtils"

function workspaceSummary(workspace: Workspace): SettingsWorkspaceSummary {
  return {
    id: workspace.id,
    name: workspace.name,
    activeLayout: workspace.activeLayout,
    activeTheme: workspace.activeTheme,
    activeBackgroundProvider: workspace.activeBackgroundProvider,
    ...(workspace.activeBackgroundRenderer
      ? { activeBackgroundRenderer: workspace.activeBackgroundRenderer }
      : {}),
    regionCount: 2, // Dashboard has 2 regions: topbar (search) + mainGrid (widgets)
  }
}

export function openWorkbenchSettings(
  options: {
    panels: SettingsPanelDescriptor[]
    surface: SettingsSurface
    setActiveSettingsSectionId: (sectionId: SettingsSectionId) => void
    setSettingsOpen: (open: boolean) => void
  },
  panelId?: string,
) {
  const sectionId = resolveInitialSettingsSectionId(options.panels, panelId, options.surface)
  options.setActiveSettingsSectionId(sectionId)
  options.setSettingsOpen(true)
  return sectionId
}

export function buildWorkbenchSettingsPanelProps(
  panel: SettingsPanelDescriptor,
  options: {
    workspace: Workspace | null
    workspaces: Workspace[]
    themes: NonNullable<SettingsPanelData["themes"]>
    backgrounds: NonNullable<SettingsPanelData["backgrounds"]>
    searchProviders: NonNullable<SettingsPanelData["searchProviders"]>
    searchSettings: NonNullable<SettingsPanelData["searchSettings"]>
    plugins: NonNullable<SettingsPanelData["plugins"]>
    aiSettings?: AiSettingsService
    locale: SettingsPanelViewProps["locale"]
    availableLocales: SettingsPanelViewProps["availableLocales"]
    host: SettingsPanelViewProps["host"]
    instanceId?: string
    surface: SettingsSurface
  },
): SettingsPanelViewProps {
  const host: SettingsPanelViewProps["host"] = {
    close: () => options.host.close(),
    setDirty: (isDirty) => options.host.setDirty(isDirty),
  }

  const grants = new Set<SettingsHostActionId>(panel.grantedHostActions ?? [])
  const readGrants = new Set<SettingsHostReadId>(panel.grantedHostReads ?? [])
  if (grants.has("workspace.theme.write") && options.host.switchTheme) {
    host.switchTheme = (themeId) => Promise.resolve(options.host.switchTheme?.(themeId))
  }
  if (grants.has("workspace.background.write") && options.host.switchBackground) {
    host.switchBackground = (backgroundId) =>
      Promise.resolve(options.host.switchBackground?.(backgroundId))
  }
  if (grants.has("workspace.search.write") && options.host.setDefaultSearchProvider) {
    host.setDefaultSearchProvider = (providerId) =>
      Promise.resolve(options.host.setDefaultSearchProvider?.(providerId))
  }
  if (grants.has("workspace.locale.write") && options.host.switchLocale) {
    host.switchLocale = (locale) => options.host.switchLocale!(locale)
  }
  if (grants.has("workspace.search.write") && options.host.setSearchProviderEnabled) {
    host.setSearchProviderEnabled = (providerId, enabled) =>
      options.host.setSearchProviderEnabled!(providerId, enabled)
  }
  if (grants.has("workspace.transfer")) {
    if (options.host.exportWorkspace) host.exportWorkspace = () => options.host.exportWorkspace!()
    if (options.host.importWorkspace)
      host.importWorkspace = (json) => options.host.importWorkspace!(json)
  }
  if (grants.has("workspace.manage")) {
    if (options.host.createWorkspace)
      host.createWorkspace = (name) => options.host.createWorkspace!(name)
    if (options.host.switchWorkspace)
      host.switchWorkspace = (id) => options.host.switchWorkspace!(id)
    if (options.host.deleteWorkspace)
      host.deleteWorkspace = (id) => options.host.deleteWorkspace!(id)
  }
  if (grants.has("plugins.manage")) {
    if (options.host.togglePluginEnabled)
      host.togglePluginEnabled = (pluginId, enabled) =>
        options.host.togglePluginEnabled!(pluginId, enabled)
  }
  if (readGrants.has("ai.settings.read") && options.aiSettings) {
    host.getAiSettings = () => options.aiSettings!.getSettings()
  }
  if (grants.has("ai.settings.write") && options.aiSettings) {
    host.saveAiSettings = (update) => options.aiSettings!.saveSettings(update)
    if (options.aiSettings.discoverCustomModels) {
      host.discoverAiModels = (baseUrl, apiKey) =>
        options.aiSettings!.discoverCustomModels!(baseUrl, apiKey)
    }
  }

  const data: SettingsPanelData = {}
  if (readGrants.has("workspace.current.read")) {
    data.workspace = workspaceSummary(requireWorkspace(options.workspace))
  }
  if (readGrants.has("workspace.list.read")) {
    data.workspaces = options.workspaces.map(workspaceSummary)
  }
  if (readGrants.has("catalog.themes.read")) data.themes = options.themes
  if (readGrants.has("catalog.backgrounds.read")) data.backgrounds = options.backgrounds
  if (readGrants.has("catalog.search-providers.read"))
    data.searchProviders = options.searchProviders
  if (readGrants.has("workspace.search.read")) data.searchSettings = options.searchSettings
  if (readGrants.has("plugins.read")) data.plugins = options.plugins

  return {
    panelId: panel.id,
    pluginId: panel.pluginId,
    scope: panel.scope,
    ...(panel.scope === "instance" && options.instanceId ? { instanceId: options.instanceId } : {}),
    surface: options.surface,
    ...(options.locale ? { locale: options.locale } : {}),
    ...(options.availableLocales ? { availableLocales: options.availableLocales } : {}),
    host,
    data,
  }
}

export function createWorkbenchSettingsPanelPropsBuilder(options: {
  getWorkspace: () => Workspace | null
  getWorkspaces: () => Workspace[]
  getThemes: () => NonNullable<SettingsPanelData["themes"]>
  getBackgrounds: () => NonNullable<SettingsPanelData["backgrounds"]>
  getSearchProviders: () => NonNullable<SettingsPanelData["searchProviders"]>
  getSearchSettings: () => NonNullable<SettingsPanelData["searchSettings"]>
  getPlugins: () => NonNullable<SettingsPanelData["plugins"]>
  aiSettings?: AiSettingsService
  getLocale: () => SettingsPanelViewProps["locale"]
  getAvailableLocales: () => SettingsPanelViewProps["availableLocales"]
  host: SettingsPanelViewProps["host"]
}) {
  return (
    panel: SettingsPanelDescriptor,
    instanceId: string | undefined,
    surface: SettingsSurface,
  ): SettingsPanelViewProps =>
    buildWorkbenchSettingsPanelProps(panel, {
      workspace: options.getWorkspace(),
      workspaces: options.getWorkspaces(),
      themes: options.getThemes(),
      backgrounds: options.getBackgrounds(),
      searchProviders: options.getSearchProviders(),
      searchSettings: options.getSearchSettings(),
      plugins: options.getPlugins(),
      ...(options.aiSettings ? { aiSettings: options.aiSettings } : {}),
      locale: options.getLocale(),
      availableLocales: options.getAvailableLocales(),
      host: options.host,
      ...(instanceId ? { instanceId } : {}),
      surface,
    })
}
