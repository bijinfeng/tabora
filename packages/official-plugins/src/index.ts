import { layoutDashboardManifest } from "@tabora/layout-dashboard/manifest"
import { layoutMobileManifest } from "@tabora/layout-mobile/manifest"
import { createBuiltinPluginPackage, createLazyBuiltinPlugin } from "@tabora/platform-kernel"
import { officialPluginNotesManifest } from "@tabora/plugin-notes/manifest"
import { officialPluginQuickLinksManifest } from "@tabora/plugin-quick-links/manifest"
import { officialPluginTodoManifest } from "@tabora/plugin-todo/manifest"
import { officialPluginWeatherManifest } from "@tabora/plugin-weather/manifest"

import { officialBackgroundBasic } from "./background-basic"
export { createOfficialAccountSyncPlugin, type AccountSyncPluginOptions } from "./account-sync"
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
  async load() {
    return (await import("@tabora/layout-dashboard")).layoutDashboard
  },
})

export const layoutMobile = createLazyBuiltinPlugin({
  manifest: layoutMobileManifest,
  async load() {
    return (await import("@tabora/layout-mobile")).layoutMobile
  },
})

export const officialSearchCommandBar = createLazyBuiltinPlugin({
  manifest: officialSearchCommandBarManifest,
  async load() {
    return (await import("./search-command-bar")).officialSearchCommandBar
  },
})

export const officialPluginWeather = createLazyBuiltinPlugin({
  manifest: officialPluginWeatherManifest,
  async load() {
    return (await import("@tabora/plugin-weather")).officialPluginWeather
  },
})

export const officialPluginTodo = createLazyBuiltinPlugin({
  manifest: officialPluginTodoManifest,
  async load() {
    return (await import("@tabora/plugin-todo")).officialPluginTodo
  },
})

export const officialPluginQuickLinks = createLazyBuiltinPlugin({
  manifest: officialPluginQuickLinksManifest,
  async load() {
    return (await import("@tabora/plugin-quick-links")).officialPluginQuickLinks
  },
})

export const officialPluginNotes = createLazyBuiltinPlugin({
  manifest: officialPluginNotesManifest,
  async load() {
    return (await import("@tabora/plugin-notes")).officialPluginNotes
  },
})

export const officialPluginManager = createLazyBuiltinPlugin({
  manifest: officialPluginManagerManifest,
  async load() {
    return (await import("./plugin-manager-entry")).officialPluginManager
  },
})

export const officialSettingsWorkspace = createLazyBuiltinPlugin({
  manifest: officialSettingsWorkspaceManifest,
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
  createBuiltinPluginPackage(officialWorkspacePresetPack),
  createBuiltinPluginPackage(officialThemeDefaultPack),
  createBuiltinPluginPackage(officialBackgroundBasic),
  layoutDashboard,
  layoutMobile,
  officialSearchCommandBar,
  createBuiltinPluginPackage(officialSearchProvidersBasic),
  officialPluginWeather,
  officialPluginTodo,
  officialPluginQuickLinks,
  officialPluginNotes,
  officialPluginManager,
  officialSettingsWorkspace,
]
