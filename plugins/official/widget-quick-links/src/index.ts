import type { PluginModule } from "@tabora/plugin-api/sdk"
import { QuickLinksCard } from "./quick-links-card"
import { QuickLinksExpand } from "./quick-links-expand"
import { QuickLinksExpandFooter } from "./quick-links-expand-footer"
import { officialPluginQuickLinksManifest } from "./manifest"

export const officialPluginQuickLinks: PluginModule = {
  manifest: officialPluginQuickLinksManifest,
  activate(context) {
    context.views.register("official.widgets.quick-links.card", QuickLinksCard)
    context.views.register("official.widgets.quick-links.expand", QuickLinksExpand)
    context.views.register("official.widgets.quick-links.expand-footer", QuickLinksExpandFooter)
  },
}
