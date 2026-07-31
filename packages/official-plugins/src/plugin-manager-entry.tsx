import type { BuiltinPlugin } from "@tabora/platform-kernel"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"
import { PluginManagerCard } from "./plugin-manager"
import { officialPluginManagerManifest } from "./ui-plugin-manifests"

export const officialPluginManager: BuiltinPlugin = {
  enabled: true,
  manifest: officialPluginManagerManifest,
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
