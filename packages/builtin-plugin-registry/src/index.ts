import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { layoutDiyMasonry } from "@tabora/layout-diy-masonry"
import { officialPlugins } from "@tabora/official-plugins"
import officialPluginsStylesHref from "@tabora/official-plugins/styles.css?url"
import layoutDashboardStylesHref from "@tabora/layout-dashboard/styles.css?url"
import layoutDiyMasonryStylesHref from "@tabora/layout-diy-masonry/styles.css?url"
import notesStylesHref from "@tabora/plugin-notes/styles.css?url"
import quickLinksStylesHref from "@tabora/plugin-quick-links/styles.css?url"
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
    plugins: "official.settings.plugins",
  },
  searchHistory: {
    pluginId: "official.search.command-bar",
    key: "search-history",
  },
} as const

const styleAssetUrlsByPluginId: Record<string, Record<string, string>> = {
  "official.layout.workbench-dashboard": { "./styles.css": layoutDashboardStylesHref },
  "official.search.command-bar": { "./styles.css": officialPluginsStylesHref },
  "official.widgets.notes": { "./styles.css": notesStylesHref },
  "official.widgets.quick-links": { "./styles.css": quickLinksStylesHref },
  "official.widgets.todo": { "./styles.css": todoStylesHref },
  "official.widgets.weather": { "./styles.css": weatherStylesHref },
  "official.plugin-manager": { "./styles.css": officialPluginsStylesHref },
  "official.settings.workspace": { "./styles.css": officialPluginsStylesHref },
  "community.layout.diy-masonry": { "./styles.css": layoutDiyMasonryStylesHref },
}

function attachStyleAssets(plugin: BuiltinPlugin): BuiltinPlugin {
  const styleAssetUrls = styleAssetUrlsByPluginId[plugin.manifest.id]
  return styleAssetUrls ? { ...plugin, styleAssetUrls } : plugin
}

export const builtinPlugins: BuiltinPlugin[] = [...officialPlugins, layoutDiyMasonry].map(
  attachStyleAssets,
)
