import type { PluginModule } from "@tabora/plugin-api/sdk"
import { NotesCard } from "./notes-card"
import { NotesExpand } from "./notes-expand"
import { officialPluginNotesManifest } from "./manifest"

export const officialPluginNotes: PluginModule = {
  manifest: officialPluginNotesManifest,
  activate(context) {
    context.views.register("official.widgets.notes.card", NotesCard)
    context.views.register("official.widgets.notes.expand", NotesExpand)
  },
}
