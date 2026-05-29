import type { BuiltinPlugin } from "@tabora/platform-kernel"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"
import { PluginManagerCard, type PluginSummary } from "./plugin-manager"

let pluginSummaryProvider: () => PluginSummary[] = () => []

export function setPluginManagerFallbackPlugins(provider: () => PluginSummary[]) {
  pluginSummaryProvider = provider
}

export const officialPluginManager: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.plugin-manager",
    name: "Plugin Manager",
    version: "0.0.0",
    entry: "./plugin-manager-entry",
    engine: { platform: "^0.1.0" },
    contributes: {
      settingsPanels: [
        {
          id: "official.settings.plugins",
          title: "插件",
          view: "official.plugin-manager.card",
          order: 10,
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register(
      "official.plugin-manager.card",
      (props: SettingsPanelViewProps) =>
        PluginManagerCard({
          plugins: props.plugins ?? pluginSummaryProvider(),
          host: props.host,
        }),
    )
  },
}
