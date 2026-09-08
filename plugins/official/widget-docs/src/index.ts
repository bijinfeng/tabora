import type { PluginModule } from "@tabora/plugin-api/sdk"
import { DocsCard } from "./docs-card"
import { DocsExpand } from "./docs-expand"
import { officialPluginDocsManifest } from "./manifest"

export const officialPluginDocs: PluginModule = {
  manifest: officialPluginDocsManifest,
  activate(context) {
    context.views.register("official.widgets.docs.card", DocsCard)
    context.views.register("official.widgets.docs.expand", DocsExpand)
  },
}
