import type { BuiltinPlugin } from "@tabora/platform-kernel"
import type { SettingsPanelViewProps, WidgetViewProps } from "@tabora/plugin-api"
import { PluginManagerCard } from "./plugin-manager"

function PluginStatusWidget(_props: WidgetViewProps) {
  return (
    <div class="plugin-stats">
      <div class="plugin-stat">
        <span>Widget 活跃</span>
        <span class="plugin-stat-val accent">6</span>
      </div>
      <div class="plugin-stat">
        <span>布局</span>
        <span class="plugin-stat-val accent">Dashboard</span>
      </div>
      <div class="plugin-stat">
        <span>搜索源</span>
        <span class="plugin-stat-val accent">google</span>
      </div>
      <div class="plugin-stat">
        <span>背景</span>
        <span class="plugin-stat-val">solid1</span>
      </div>
    </div>
  )
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
      widgets: [
        {
          id: "plugin-status",
          title: "插件状态",
          icon: "boxes",
          description: "查看工作台插件运行状态",
          supportedSizes: ["S"],
          defaultSize: "S",
          allowMultipleInstances: false,
          views: { card: "official.plugin-manager.status-widget" },
        },
      ],
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
    context.registry.views.register("official.plugin-manager.status-widget", PluginStatusWidget)
  },
}
