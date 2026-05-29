export { officialBackgroundBasic } from "./background-basic"
export { officialLayoutWorkbenchDashboard } from "./layout-workbench-dashboard"
export { officialLayoutTopSearchGrid } from "./layout-top-search-grid"
export { officialPluginManager } from "./plugin-manager-entry"
export { officialSearchCommandBar } from "./search-command-bar"
export { officialSettingsWorkspace } from "./settings-workspace"
export { officialSearchProvidersBasic } from "./search-providers-basic"
export { officialThemeDefaultPack } from "./theme-default-pack"
export { officialWidgetsProductivity } from "./widgets-productivity"

import { officialBackgroundBasic } from "./background-basic"
import { officialLayoutWorkbenchDashboard } from "./layout-workbench-dashboard"
import { officialLayoutTopSearchGrid } from "./layout-top-search-grid"
import { officialPluginManager, setPluginManagerFallbackPlugins } from "./plugin-manager-entry"
import { officialSearchCommandBar } from "./search-command-bar"
import { officialSettingsWorkspace } from "./settings-workspace"
import { officialSearchProvidersBasic } from "./search-providers-basic"
import { officialThemeDefaultPack } from "./theme-default-pack"
import { officialWidgetsProductivity } from "./widgets-productivity"

export const officialPlugins = [
  officialThemeDefaultPack,
  officialBackgroundBasic,
  officialLayoutWorkbenchDashboard,
  officialLayoutTopSearchGrid,
  officialSearchCommandBar,
  officialSearchProvidersBasic,
  officialWidgetsProductivity,
  officialPluginManager,
  officialSettingsWorkspace,
]

setPluginManagerFallbackPlugins(() =>
  officialPlugins.map((plugin) => ({
    id: plugin.manifest.id,
    name: plugin.manifest.name,
    version: plugin.manifest.version,
    enabled: plugin.enabled,
    permissions: plugin.manifest.permissions ?? [],
    contributes: plugin.manifest.contributes,
  })),
)
