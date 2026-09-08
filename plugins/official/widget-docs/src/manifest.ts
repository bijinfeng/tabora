import type { PluginManifest } from "@tabora/plugin-api/sdk"

export const officialPluginDocsManifest: PluginManifest = {
  id: "official.widgets.docs",
  name: "Docs Widget",
  version: "1.0.0",
  apiVersion: "1.0.0",
  entry: "./index",
  styles: [{ href: "./styles.css", scope: "plugin", order: 40 }],
  engine: { platform: "^0.1.0" },
  contributes: {
    widgets: [
      {
        id: "docs",
        title: "文档笔记",
        icon: "file-text",
        description: "以富文本编辑器整理长文档笔记",
        supportedSizes: ["S", "M", "L", "XL"],
        defaultSize: "L",
        allowMultipleInstances: true,
        views: {
          card: "official.widgets.docs.card",
          expand: "official.widgets.docs.expand",
        },
      },
    ],
  },
}
