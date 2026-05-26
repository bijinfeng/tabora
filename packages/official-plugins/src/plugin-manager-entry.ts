import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { PluginManagerCard } from "./plugin-manager"

export const officialPluginManager: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.plugin-manager",
    name: "Plugin Manager",
    version: "0.0.0",
    entry: "./plugin-manager-entry",
    engine: { platform: "^0.1.0" },
    contributes: {
      widgets: [
        {
          id: "plugin-manager",
          title: "插件管理",
          supportedSizes: ["M", "L", "XL"],
          defaultSize: "L",
          allowMultipleInstances: false,
          views: { card: "official.plugin-manager.card" },
        },
      ],
      settingsPanels: [
        {
          id: "official.settings.plugins",
          title: "插件",
          view: "official.plugin-manager.card",
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.plugin-manager.card", PluginManagerCard)
  },
}
