import type { PluginModule } from "@tabora/plugin-api/sdk"
import { officialPluginAiChatManifest } from "./manifest"
import { AiChatCard } from "./ai-chat-card"
import { AiChatExpand } from "./ai-chat-expand"
import {
  runNewConversationCommand,
  setAiChatRuntime,
  setAiChatSettingsOpener,
} from "./ai-chat-session"

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
  },
}
