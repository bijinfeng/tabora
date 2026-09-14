import * as stylex from "@stylexjs/stylex"
import { onCleanup, onMount } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api/sdk"
import Orbit from "lucide-solid/icons/orbit"
import { getAiChatSession, registerAiChatView } from "../conversation/ai-chat-session"
import { cardStyles } from "./ai-chat-card.styles"

export function AiChatCard(props: WidgetViewProps) {
  const session = getAiChatSession({ instanceId: props.instanceId, data: props.data })

  onMount(() => {
    const unregister = registerAiChatView({
      instanceId: props.instanceId,
      session,
      openExpand: () => props.host.openExpand(),
    })
    onCleanup(unregister)
  })

  return (
    <div {...stylex.attrs(props.size === "S" ? cardStyles.brandCardSmall : cardStyles.brandCard)}>
      <div
        {...stylex.attrs(props.size === "S" ? cardStyles.brandVisualSmall : cardStyles.brandVisual)}
        aria-hidden="true"
      >
        <Orbit size={props.size === "S" ? 28 : 30} strokeWidth={1.7} />
      </div>
      <div
        {...stylex.attrs(
          props.size === "S" ? cardStyles.brandContentSmall : cardStyles.brandContent,
        )}
      >
        <span
          {...stylex.attrs(props.size === "S" ? cardStyles.brandTitleSmall : cardStyles.brandTitle)}
        >
          AI 对话
        </span>
        <span
          {...stylex.attrs(props.size === "S" ? cardStyles.brandRuleSmall : cardStyles.brandRule)}
          aria-hidden="true"
        />
        <span
          {...stylex.attrs(props.size === "S" ? cardStyles.brandMetaSmall : cardStyles.brandMeta)}
        >
          Tabora / AI
        </span>
      </div>
    </div>
  )
}
