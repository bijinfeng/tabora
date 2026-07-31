import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { NotesCard } from "./notes-card"
import { NotesExpand } from "./notes-expand"
import { officialPluginNotesManifest } from "./manifest"

export const officialPluginNotes: BuiltinPlugin = {
  enabled: true,
  manifest: officialPluginNotesManifest,
  activate(context) {
    context.registry.views.register("official.widgets.notes.card", NotesCard)
    context.registry.views.register("official.widgets.notes.expand", NotesExpand)
  },
}
