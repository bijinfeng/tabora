import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { layoutDiyMasonry } from "@tabora/layout-diy-masonry"
import { officialPlugins } from "@tabora/official-plugins"
import officialPluginManagerStylesHref from "@tabora/official-plugins/plugin-manager-entry.css?url"
import officialSettingsWorkspaceStylesHref from "@tabora/official-plugins/settings-workspace.css?url"
import officialSearchCommandBarStylesHref from "@tabora/official-plugins/search-command-bar.css?url"
import layoutDashboardStylesHref from "@tabora/layout-dashboard/styles.css?url"
import layoutDiyMasonryStylesHref from "@tabora/layout-diy-masonry/styles.css?url"
import notesStylesHref from "@tabora/plugin-notes/styles.css?url"
import quickLinksStylesHref from "@tabora/plugin-quick-links/styles.css?url"
import todayFocusStylesHref from "@tabora/plugin-today-focus/styles.css?url"
import todoStylesHref from "@tabora/plugin-todo/styles.css?url"
import weatherStylesHref from "@tabora/plugin-weather/styles.css?url"

export {
  officialPlugins,
  officialDefaultWorkspacePreset as builtinDefaultWorkspacePreset,
} from "@tabora/official-plugins"

export const builtinWorkbenchShellConfig = {
  themeIds: {
    light: "official.theme.light",
    dark: "official.theme.dark",
  },
  layoutIds: {
    dashboard: "official.layout.workbench-dashboard",
    focus: "official.layout.workbench-focus",
  },
  settingsPanelIds: {
    appearance: "official.settings.workspace.appearance",
  },
  searchHistory: {
    pluginId: "official.search.command-bar",
    key: "search-history",
  },
} as const

const styleAssetUrlsByPluginId: Record<string, Record<string, string>> = {
  "official.layout.workbench-dashboard": { "./styles.css": layoutDashboardStylesHref },
  "official.search.command-bar": {
    "./search-command-bar.css": officialSearchCommandBarStylesHref,
  },
  "official.widgets.notes": { "./styles.css": notesStylesHref },
  "official.widgets.quick-links": { "./styles.css": quickLinksStylesHref },
  "official.widgets.today-focus": { "./styles.css": todayFocusStylesHref },
  "official.widgets.todo": { "./styles.css": todoStylesHref },
  "official.widgets.weather": { "./styles.css": weatherStylesHref },
  "official.plugin-manager": {
    "./plugin-manager-entry.css": officialPluginManagerStylesHref,
  },
  "official.settings.workspace": {
    "./settings-workspace.css": officialSettingsWorkspaceStylesHref,
  },
  "community.layout.diy-masonry": { "./styles.css": layoutDiyMasonryStylesHref },
}

function attachStyleAssets(plugin: BuiltinPlugin): BuiltinPlugin {
  const styleAssetUrls = styleAssetUrlsByPluginId[plugin.manifest.id]
  return styleAssetUrls ? { ...plugin, styleAssetUrls } : plugin
}

export const builtinPlugins: BuiltinPlugin[] = [...officialPlugins, layoutDiyMasonry].map(
  attachStyleAssets,
)
