import {
  createOfficialAccountSyncPlugin,
  type AccountSyncPluginOptions,
} from "@tabora/official-plugins"
import type { LoadedPluginPackage } from "@tabora/platform-kernel"
import { layoutDiyMasonryManifest } from "@tabora/layout-diy-masonry/manifest"
import { officialPlugins } from "@tabora/official-plugins"
import { createBuiltinPluginPackage, createLazyBuiltinPlugin } from "@tabora/platform-kernel"
import officialPluginsStylesHref from "@tabora/official-plugins/styles.css?url"
import layoutDashboardStylesHref from "@tabora/layout-dashboard/styles.css?url"
import layoutMobileStylesHref from "@tabora/layout-mobile/styles.css?url"
import layoutDiyMasonryStylesHref from "@tabora/layout-diy-masonry/styles.css?url"
import notesStylesHref from "@tabora/plugin-notes/styles.css?url"
import quickLinksStylesHref from "@tabora/plugin-quick-links/styles.css?url"
import todoStylesHref from "@tabora/plugin-todo/styles.css?url"
import weatherStylesHref from "@tabora/plugin-weather/styles.css?url"

export { officialPlugins } from "@tabora/official-plugins"
export { builtinDefaultWorkspacePreset, builtinWorkbenchShellConfig } from "./workspace"

const styleAssetUrlsByPluginId: Record<string, Record<string, string>> = {
  "official.layout.workbench-dashboard": { "./styles.css": layoutDashboardStylesHref },
  "official.layout.workbench-mobile": { "./styles.css": layoutMobileStylesHref },
  "official.search.command-bar": { "./styles.css": officialPluginsStylesHref },
  "official.widgets.notes": { "./styles.css": notesStylesHref },
  "official.widgets.quick-links": { "./styles.css": quickLinksStylesHref },
  "official.widgets.todo": { "./styles.css": todoStylesHref },
  "official.widgets.weather": { "./styles.css": weatherStylesHref },
  "official.plugin-manager": { "./styles.css": officialPluginsStylesHref },
  "official.settings.workspace": { "./styles.css": officialPluginsStylesHref },
  "community.layout.diy-masonry": { "./styles.css": layoutDiyMasonryStylesHref },
}

function attachStyleAssets(pluginPackage: LoadedPluginPackage): LoadedPluginPackage {
  const styleAssetUrls = styleAssetUrlsByPluginId[pluginPackage.module.manifest.id]
  return styleAssetUrls ? { ...pluginPackage, styleAssetUrls } : pluginPackage
}

const layoutDiyMasonry = createLazyBuiltinPlugin({
  manifest: layoutDiyMasonryManifest,
  async load() {
    return (await import("@tabora/layout-diy-masonry")).layoutDiyMasonry
  },
})

export const builtinPlugins: LoadedPluginPackage[] = [...officialPlugins, layoutDiyMasonry].map(
  attachStyleAssets,
)

export function createBuiltinAccountSyncPlugin(
  options: AccountSyncPluginOptions,
): LoadedPluginPackage {
  return attachStyleAssets(createBuiltinPluginPackage(createOfficialAccountSyncPlugin(options)))
}
