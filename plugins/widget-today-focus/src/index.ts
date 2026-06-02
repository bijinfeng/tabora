import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { TodayFocusCard } from "./today-focus-card"

export const officialPluginTodayFocus: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.widgets.today-focus",
    name: "Today Focus Widget",
    version: "1.0.0",
    entry: "./index",
    engine: { platform: "^0.1.0" },
    contributes: {
      widgets: [
        {
          id: "today-focus",
          title: "今日重点",
          icon: "target",
          description: "记录今日最重要的任务",
          supportedSizes: ["S", "M", "L"],
          defaultSize: "M",
          allowMultipleInstances: true,
          views: { card: "official.widgets.today-focus.card" },
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.widgets.today-focus.card", TodayFocusCard)
  },
}
