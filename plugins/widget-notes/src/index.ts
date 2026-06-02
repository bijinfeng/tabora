import type { BuiltinPlugin } from "@tabora/platform-kernel"
import { NotesCard, NotesModal } from "./notes-card"

export const officialPluginNotes: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "official.widgets.notes",
    name: "Notes Widget",
    version: "1.0.0",
    entry: "./index",
    engine: { platform: "^0.1.0" },
    contributes: {
      widgets: [
        {
          id: "notes",
          title: "便签",
          icon: "pencil",
          description: "随手记下想法和灵感",
          supportedSizes: ["S", "M", "L"],
          defaultSize: "M",
          allowMultipleInstances: true,
          views: { card: "official.widgets.notes.card", modal: "official.widgets.notes.modal" },
        },
      ],
    },
  },
  activate(context) {
    context.registry.views.register("official.widgets.notes.card", NotesCard)
    context.registry.views.register("official.widgets.notes.modal", NotesModal)
  },
}
