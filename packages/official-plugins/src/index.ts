import { officialBackgroundBasic } from "./background-basic"
import { layoutDashboard } from "@tabora/layout-dashboard"
import { officialPluginManager } from "./plugin-manager-entry"
import { officialSearchCommandBar } from "./search-command-bar"
import { officialSettingsWorkspace } from "./settings-workspace"
import { officialSearchProvidersBasic } from "./search-providers-basic"
import { officialThemeDefaultPack } from "./theme-default-pack"
import {
  officialDefaultWorkspacePreset,
  officialWorkspacePresetPack,
} from "./workspace-default-preset"
import { officialPluginWeather } from "@tabora/plugin-weather"
import { officialPluginTodo } from "@tabora/plugin-todo"
import { officialPluginQuickLinks } from "@tabora/plugin-quick-links"
import { officialPluginTodayFocus } from "@tabora/plugin-today-focus"
import { officialPluginNotes } from "@tabora/plugin-notes"

export {
  officialBackgroundBasic,
  layoutDashboard,
  officialPluginManager,
  officialPluginNotes,
  officialPluginQuickLinks,
  officialPluginTodayFocus,
  officialPluginTodo,
  officialPluginWeather,
  officialSearchCommandBar,
  officialSettingsWorkspace,
  officialSearchProvidersBasic,
  officialThemeDefaultPack,
  officialDefaultWorkspacePreset,
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
  officialPluginTodayFocus,
  officialPluginNotes,
  officialPluginManager,
  officialSettingsWorkspace,
]
