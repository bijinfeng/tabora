import type { PluginManifest } from "@tabora/plugin-api/sdk"

export const officialPluginNotesManifest: PluginManifest = {
  id: "official.widgets.notes",
  name: "Notes Widget",
  version: "1.0.0",
  apiVersion: "1.0.0",
  entry: "./index",
  styles: [{ href: "./styles.css", scope: "plugin", order: 40 }],
  engine: { platform: "^0.1.0" },
  permissions: [{ type: "ai", access: ["generate", "tools"] }],
  contributes: {
    widgets: [
      {
        id: "notes",
        title: "便签",
        icon: "notes",
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
    aiTools: [
      {
        id: "official.widgets.notes.search-notes",
        name: "搜索便签",
        description: "按关键词在所有实例的便签内容里做文本匹配，返回最相关的片段列表",
        inputSchema: {
          type: "object",
          properties: {
            query: { type: "string", description: "要搜索的关键词或短语" },
            limit: {
              type: "number",
              description: "最多返回的片段数量（1-10），默认 5",
              minimum: 1,
              maximum: 10,
            },
          },
          required: ["query"],
          additionalProperties: false,
        },
      },
    ],
  },
}
