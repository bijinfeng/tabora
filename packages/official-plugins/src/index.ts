import { officialBackgroundBasic } from "./background-basic"
import { layoutDashboard } from "@tabora/layout-dashboard"
import { layoutStream } from "@tabora/layout-stream"
import { officialPluginManager } from "./plugin-manager-entry"
import { officialSearchCommandBar } from "./search-command-bar"
import { officialSettingsWorkspace } from "./settings-workspace"
import { officialSearchProvidersBasic } from "./search-providers-basic"
import { officialThemeDefaultPack } from "./theme-default-pack"
import { officialPluginWeather } from "@tabora/plugin-weather"
import { officialPluginTodo } from "@tabora/plugin-todo"
import { officialPluginQuickLinks } from "@tabora/plugin-quick-links"
import { officialPluginTodayFocus } from "@tabora/plugin-today-focus"
import { officialPluginNotes } from "@tabora/plugin-notes"

export {
  officialBackgroundBasic,
  layoutDashboard,
  layoutStream,
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
}

export * from "./search-model"

export const officialPlugins = [
  officialThemeDefaultPack,
  officialBackgroundBasic,
  layoutDashboard,
  layoutStream,
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
