import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { QuickLinksCard } from "./quick-links-card"

export const officialPluginQuickLinks: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.widgets.quick-links",
    name: "Quick Links Widget",
    version: "1.0.0",
    entry: "./index",
    engine: { platform: "^0.1.0" },
    contributes: {
      widgets: [
        {
          id: "quick-links",
          title: "快捷入口",
          supportedSizes: ["S", "M", "L"],
          defaultSize: "M",
          allowMultipleInstances: true,
          views: { card: "official.widgets.quick-links.card" },
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.widgets.quick-links.card", QuickLinksCard)
  },
}
