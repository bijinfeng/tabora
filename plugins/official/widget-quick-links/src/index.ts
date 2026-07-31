import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { QuickLinksCard } from "./quick-links-card"
import { QuickLinksExpand } from "./quick-links-expand"
import { QuickLinksExpandFooter } from "./quick-links-expand-footer"
import { officialPluginQuickLinksManifest } from "./manifest"

export const officialPluginQuickLinks: BuiltinPlugin = {
  enabled: true,
  manifest: officialPluginQuickLinksManifest,
  activate(context) {
    context.registry.views.register("official.widgets.quick-links.card", QuickLinksCard)
    context.registry.views.register("official.widgets.quick-links.expand", QuickLinksExpand)
    context.registry.views.register(
      "official.widgets.quick-links.expand-footer",
      QuickLinksExpandFooter,
    )
  },
}
