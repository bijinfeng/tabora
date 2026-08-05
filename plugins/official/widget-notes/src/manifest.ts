import type { PluginManifest } from "@tabora/plugin-api/sdk"

export const officialPluginNotesManifest: PluginManifest = {
  id: "official.widgets.notes",
  name: "Notes Widget",
  version: "1.0.0",
  apiVersion: "1.0.0",
  entry: "./index",
  styles: [{ href: "./styles.css", scope: "plugin", order: 40 }],
  engine: { platform: "^0.1.0" },
  contributes: {
    widgets: [
      {
        id: "notes",
        title: "便签",
        icon: "pencil",
        description: "随手记下想法和灵感",
        supportedSizes: ["S", "M", "L", "XL"],
        defaultSize: "L",
        allowMultipleInstances: true,
        views: {
          card: "official.widgets.notes.card",
          expand: "official.widgets.notes.expand",
        },
      },
    ],
  },
}
