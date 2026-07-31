import { layoutDashboardManifest } from "@tabora/layout-dashboard/manifest"
import { createLazyBuiltinPlugin } from "@tabora/platform-kernel"
import { officialPluginNotesManifest } from "@tabora/plugin-notes/manifest"
import { officialPluginQuickLinksManifest } from "@tabora/plugin-quick-links/manifest"
import { officialPluginTodoManifest } from "@tabora/plugin-todo/manifest"
import { officialPluginWeatherManifest } from "@tabora/plugin-weather/manifest"

import { officialBackgroundBasic } from "./background-basic"
import { officialSearchProvidersBasic } from "./search-providers-basic"
import { officialThemeDefaultPack } from "./theme-default-pack"
import {
  officialPluginManagerManifest,
  officialSearchCommandBarManifest,
  officialSettingsWorkspaceManifest,
} from "./ui-plugin-manifests"
import {
  officialDefaultWorkspacePreset,
  officialWorkspacePresetPack,
} from "./workspace-default-preset"

export const layoutDashboard = createLazyBuiltinPlugin({
  manifest: layoutDashboardManifest,
  enabled: true,
  async load() {
    return (await import("@tabora/layout-dashboard")).layoutDashboard
  },
})

export const officialSearchCommandBar = createLazyBuiltinPlugin({
  manifest: officialSearchCommandBarManifest,
  enabled: true,
  async load() {
    return (await import("./search-command-bar")).officialSearchCommandBar
  },
})

export const officialPluginWeather = createLazyBuiltinPlugin({
  manifest: officialPluginWeatherManifest,
  enabled: true,
  async load() {
    return (await import("@tabora/plugin-weather")).officialPluginWeather
  },
})

export const officialPluginTodo = createLazyBuiltinPlugin({
  manifest: officialPluginTodoManifest,
  enabled: true,
  async load() {
    return (await import("@tabora/plugin-todo")).officialPluginTodo
  },
})

export const officialPluginQuickLinks = createLazyBuiltinPlugin({
  manifest: officialPluginQuickLinksManifest,
  enabled: true,
  async load() {
    return (await import("@tabora/plugin-quick-links")).officialPluginQuickLinks
  },
})

export const officialPluginNotes = createLazyBuiltinPlugin({
  manifest: officialPluginNotesManifest,
  enabled: true,
  async load() {
    return (await import("@tabora/plugin-notes")).officialPluginNotes
  },
})

export const officialPluginManager = createLazyBuiltinPlugin({
  manifest: officialPluginManagerManifest,
  enabled: true,
  async load() {
    return (await import("./plugin-manager-entry")).officialPluginManager
  },
})

export const officialSettingsWorkspace = createLazyBuiltinPlugin({
  manifest: officialSettingsWorkspaceManifest,
  enabled: true,
  async load() {
    return (await import("./settings-workspace")).officialSettingsWorkspace
  },
})

export {
  officialBackgroundBasic,
  officialDefaultWorkspacePreset,
  officialSearchProvidersBasic,
  officialThemeDefaultPack,
  officialWorkspacePresetPack,
}

export const officialPlugins = [
  officialWorkspacePresetPack,
  officialThemeDefaultPack,
  officialBackgroundBasic,
  layoutDashboard,
  officialSearchCommandBar,
  officialSearchProvidersBasic,
  officialPluginWeather,
  officialPluginTodo,
  officialPluginQuickLinks,
  officialPluginNotes,
  officialPluginManager,
  officialSettingsWorkspace,
]
