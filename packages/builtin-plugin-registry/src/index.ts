import {
  createOfficialAccountSyncPlugin,
  type AccountSyncPluginOptions,
} from "@tabora/official-plugins"
import type { LoadedPluginPackage } from "@tabora/platform-kernel"
import { officialPlugins } from "@tabora/official-plugins"
import { createBuiltinPluginPackage } from "@tabora/platform-kernel"
import aiChatStylesHref from "@tabora/plugin-ai-chat/styles.css?url"
import officialPluginsStylesHref from "@tabora/official-plugins/styles.css?url"
import notesStylesHref from "@tabora/plugin-notes/styles.css?url"
import quickLinksStylesHref from "@tabora/plugin-quick-links/styles.css?url"
import todoStylesHref from "@tabora/plugin-todo/styles.css?url"
import weatherStylesHref from "@tabora/plugin-weather/styles.css?url"

export { officialPlugins } from "@tabora/official-plugins"
export { builtinDefaultWorkspacePreset, builtinWorkbenchShellConfig } from "./workspace"

const styleAssetUrlsByPluginId: Record<string, Record<string, string>> = {
  "official.search.command-bar": { "./styles.css": officialPluginsStylesHref },
  "official.widgets.ai-chat": { "./styles.css": aiChatStylesHref },
  "official.widgets.notes": { "./styles.css": notesStylesHref },
  "official.widgets.quick-links": { "./styles.css": quickLinksStylesHref },
  "official.widgets.todo": { "./styles.css": todoStylesHref },
  "official.widgets.weather": { "./styles.css": weatherStylesHref },
  "official.plugin-manager": { "./styles.css": officialPluginsStylesHref },
  "official.settings.workspace": { "./styles.css": officialPluginsStylesHref },
}

function attachStyleAssets(pluginPackage: LoadedPluginPackage): LoadedPluginPackage {
  const styleAssetUrls = styleAssetUrlsByPluginId[pluginPackage.module.manifest.id]
  return styleAssetUrls ? { ...pluginPackage, styleAssetUrls } : pluginPackage
}

export const builtinPlugins: LoadedPluginPackage[] = officialPlugins.map(attachStyleAssets)

export function createBuiltinAccountSyncPlugin(
  options: AccountSyncPluginOptions,
): LoadedPluginPackage {
  return attachStyleAssets(createBuiltinPluginPackage(createOfficialAccountSyncPlugin(options)))
}
