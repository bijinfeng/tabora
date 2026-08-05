import type { PluginModule, SettingsPanelViewProps } from "@tabora/plugin-api/sdk"
import { PluginManagerCard } from "./plugin-manager"
import { officialPluginManagerManifest } from "./ui-plugin-manifests"

export const officialPluginManager: PluginModule = {
  manifest: officialPluginManagerManifest,
  activate(context) {
    context.views.register("official.plugin-manager.card", (props: SettingsPanelViewProps) =>
      PluginManagerCard({
        plugins: props.data.plugins ?? [],
        host: props.host,
      }),
    )
  },
}
