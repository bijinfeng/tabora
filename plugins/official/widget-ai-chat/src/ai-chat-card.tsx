import * as stylex from "@stylexjs/stylex"
import { onCleanup, onMount } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api/sdk"
import Orbit from "lucide-solid/icons/orbit"
import { getAiChatSession, registerAiChatView } from "./ai-chat-session"
import { styles } from "./styles"

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
    <div {...stylex.attrs(props.size === "S" ? styles.brandCardSmall : styles.brandCard)}>
      <div
        {...stylex.attrs(props.size === "S" ? styles.brandVisualSmall : styles.brandVisual)}
        aria-hidden="true"
      >
        <Orbit size={props.size === "S" ? 28 : 30} strokeWidth={1.7} />
      </div>
      <div {...stylex.attrs(props.size === "S" ? styles.brandContentSmall : styles.brandContent)}>
        <span {...stylex.attrs(props.size === "S" ? styles.brandTitleSmall : styles.brandTitle)}>
          AI 对话
        </span>
        <span
          {...stylex.attrs(props.size === "S" ? styles.brandRuleSmall : styles.brandRule)}
          aria-hidden="true"
        />
        <span {...stylex.attrs(props.size === "S" ? styles.brandMetaSmall : styles.brandMeta)}>
          Tabora / AI
        </span>
      </div>
    </div>
  )
}
