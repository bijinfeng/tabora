import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { QuickLinksCard } from "./quick-links-card"

export const officialPluginQuickLinks: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.widgets.quick-links",
    name: "Quick Links Widget",
    version: "1.0.0",
    apiVersion: "1.0.0",
    entry: "./index",
    styles: [{ href: "./styles.css", scope: "plugin", order: 40 }],
    engine: { platform: "^0.1.0" },
    permissions: [{ type: "external-open", hosts: ["*"] }],
    contributes: {
      widgets: [
        {
          id: "quick-links",
          title: "快捷入口",
          icon: "link",
          description: "快速访问常用网站",
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
