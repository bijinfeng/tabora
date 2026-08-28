import type { AiRuntimeBridge, PluginModule } from "@tabora/plugin-api/sdk"
import { NotesCard } from "./notes-card"
import { NotesExpand } from "./notes-expand"
import { officialPluginNotesManifest } from "./manifest"

export const officialPluginNotes: PluginModule = {
  manifest: officialPluginNotesManifest,
  activate(context) {
    notesAiRuntime = context.ai
    context.views.register("official.widgets.notes.card", NotesCard)
    context.views.register("official.widgets.notes.expand", NotesExpand)
  },
}

let notesAiRuntime: AiRuntimeBridge | undefined

/** Views are registered by this module and consume only the plugin-scoped runtime bridge. */
export function getNotesAiRuntime(): AiRuntimeBridge | undefined {
  return notesAiRuntime
}
