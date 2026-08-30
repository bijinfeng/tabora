import { createBuiltinPluginPackage, createLazyBuiltinPlugin } from "@tabora/platform-kernel"
import { officialPluginAiChatManifest } from "@tabora/plugin-ai-chat/manifest"
import { officialPluginNotesManifest } from "@tabora/plugin-notes/manifest"
import { officialPluginQuickLinksManifest } from "@tabora/plugin-quick-links/manifest"
import { officialPluginTodoManifest } from "@tabora/plugin-todo/manifest"
import { officialPluginWeatherManifest } from "@tabora/plugin-weather/manifest"

import { officialBackgroundBasic } from "./background-basic"
export { createOfficialAccountSyncPlugin, type AccountSyncPluginOptions } from "./account-sync"
export {
  BUILTIN_BACKGROUND_PROVIDER_PLUGIN_ID,
  builtinBackgroundProviders,
} from "./builtinBackgroundProviders"
export { BUILTIN_SEARCH_PROVIDER_PLUGIN_ID, builtinSearchProviders } from "./builtinSearchProviders"
import {
  officialPluginManagerManifest,
  officialSearchCommandBarManifest,
  officialSettingsWorkspaceManifest,
} from "./ui-plugin-manifests"
import {
  officialDefaultWorkspacePreset,
  officialWorkspacePresetPack,
} from "./workspace-default-preset"

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

export const officialPluginAiChat = createLazyBuiltinPlugin({
  manifest: officialPluginAiChatManifest,
  async load() {
    return (await import("@tabora/plugin-ai-chat")).officialPluginAiChat
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

export { officialBackgroundBasic, officialDefaultWorkspacePreset, officialWorkspacePresetPack }

export const officialPlugins = [
  createBuiltinPluginPackage(officialWorkspacePresetPack),
  createBuiltinPluginPackage(officialBackgroundBasic),
  officialSearchCommandBar,
  officialPluginWeather,
  officialPluginTodo,
  officialPluginQuickLinks,
  officialPluginNotes,
  officialPluginAiChat,
  officialPluginManager,
  officialSettingsWorkspace,
]
