import type { PluginModule } from "@tabora/plugin-api/sdk"
import { officialPluginAiChatManifest } from "./manifest"
import { AiChatCard } from "./card/ai-chat-card"
import { AiChatExpand } from "./layout/ai-chat-expand"
import {
  getLatestConversationUserMessages,
  runNewConversationCommand,
  setAiChatRuntime,
  setAiChatSettingsOpener,
} from "./conversation/ai-chat-session"

export const officialPluginAiChat: PluginModule = {
  manifest: officialPluginAiChatManifest,
  activate(context) {
    setAiChatRuntime(context.ai)
    setAiChatSettingsOpener((sectionId) => context.ui.openSettings(sectionId))
    context.views.register("official.widgets.ai-chat.card", AiChatCard)
    context.views.register("official.widgets.ai-chat.expand", AiChatExpand)
    context.commands.register("official.widgets.ai-chat.new-conversation", (invocation) => {
      runNewConversationCommand(invocation.instanceId)
    })
    context.aiTools?.register(
      "official.widgets.ai-chat.summarize-chat",
      async ({ args, context: toolContext }) => {
        const style =
          typeof (args as { style?: unknown }).style === "string"
            ? ((args as { style: string }).style as "bullet" | "paragraph" | "tldr")
            : "bullet"
        const messages = getLatestConversationUserMessages(toolContext.instanceId)
        const joined = messages.map((m) => `- ${m}`).join("\n") || "（当前对话暂无文本内容）"
        switch (style) {
          case "paragraph":
            return {
              summary:
                `基于当前对话（共 ${messages.length} 条文本）的段落总结：` + joined.slice(0, 240),
            }
          case "tldr": {
            const last = messages.at(-1)
            return {
              tldr: last ? `最新问题：${last.slice(0, 120)}` : "（暂无对话）",
            }
          }
          case "bullet":
          default:
            return {
              bullets: messages.slice(-5).map((m) => m.slice(0, 120)),
              count: messages.length,
            }
        }
      },
    )
  },
}
