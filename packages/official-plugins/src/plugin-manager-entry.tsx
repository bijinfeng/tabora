import type { BuiltinPlugin } from "@tabora/platform-kernel"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"
import { PluginManagerCard } from "./plugin-manager"

export const officialPluginManager: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.plugin-manager",
    name: "Plugin Manager",
    version: "0.0.0",
    apiVersion: "1.0.0",
    entry: "./plugin-manager-entry",
    styles: [{ href: "./plugin-manager-entry.css", scope: "plugin", order: 40 }],
    engine: { platform: "^0.1.0" },
    contributes: {
      settingsPanels: [
        {
          id: "official.settings.plugins",
          title: "插件",
          view: "official.plugin-manager.card",
          section: "plugins",
          scope: "workspace",
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
          plugins: props.plugins ?? [],
          host: props.host,
        }),
    )
  },
}
