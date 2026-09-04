import * as stylex from "@stylexjs/stylex"
import { createEffect, createSignal, Show } from "solid-js"
import Brain from "lucide-solid/icons/brain"
import ChevronRight from "lucide-solid/icons/chevron-right"

import { styles } from "./styles"

/** Render only provider-supplied reasoning summaries; opaque signatures never reach this component. */
export function AiChatReasoning(props: { content: string; isComplete?: boolean }) {
  const [collapsed, setCollapsed] = createSignal(Boolean(props.isComplete))

  createEffect(() => {
    if (props.isComplete) setCollapsed(true)
  })

  return (
    <section {...stylex.attrs(styles.reasoning)} aria-label="模型思考过程">
      <button
        type="button"
        {...stylex.attrs(styles.reasoningTrigger)}
        aria-expanded={!collapsed()}
        onClick={() => setCollapsed((value) => !value)}
      >
        <ChevronRight
          size={14}
          {...stylex.attrs(styles.reasoningChevron, !collapsed() && styles.reasoningChevronOpen)}
        />
        <Brain size={14} />
        <span>{props.isComplete ? "思考过程" : "正在思考"}</span>
      </button>
      <Show when={!collapsed()}>
        <div {...stylex.attrs(styles.reasoningContent)}>{props.content}</div>
      </Show>
    </section>
  )
}
