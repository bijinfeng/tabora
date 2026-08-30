import type { PluginManifest } from "@tabora/plugin-api/sdk"

export const officialPluginAiChatManifest: PluginManifest = {
  id: "official.widgets.ai-chat",
  name: "AI Chat Widget",
  version: "0.1.0",
  apiVersion: "1.0.0",
  entry: "./index",
  styles: [{ href: "./styles.css", scope: "plugin", order: 40 }],
  engine: { platform: "^0.1.0" },
  permissions: [{ type: "ai", access: ["generate"] }],
  contributes: {
    widgets: [
      {
        id: "ai-chat",
        title: "AI 对话",
        icon: "sparkles",
        description: "与平台 AI 模型多轮对话",
        supportedSizes: ["S", "M", "L", "XL"],
        defaultSize: "L",
        allowMultipleInstances: true,
        views: {
          card: "official.widgets.ai-chat.card",
          expand: "official.widgets.ai-chat.expand",
        },
      },
    ],
    commands: [
      {
        id: "official.widgets.ai-chat.new-conversation",
        title: "新建 AI 对话",
        description: "在最近的 AI 对话卡片中开始新对话并展开",
        icon: "sparkles",
        category: "ai",
        keywords: ["ai", "chat", "对话", "助手", "提问"],
        defaultShortcut: "⌘I",
      },
    ],
    keybindings: [
      {
        id: "official.widgets.ai-chat.keybinding.new-conversation",
        commandId: "official.widgets.ai-chat.new-conversation",
        key: "mod+i",
      },
    ],
  },
}
