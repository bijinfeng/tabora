import * as stylex from "@stylexjs/stylex"
import { Show, createEffect, createSignal } from "solid-js"
import Brain from "lucide-solid/icons/brain"
import ChevronDown from "lucide-solid/icons/chevron-down"
import ChevronRight from "lucide-solid/icons/chevron-right"

import { reasoningStyles } from "./ai-chat-reasoning.styles"

/** Render only provider-supplied reasoning summaries; opaque signatures never reach this component. */
export function AiChatReasoning(props: { content: string; isComplete?: boolean }) {
  const [expanded, setExpanded] = createSignal(!props.isComplete)

  createEffect(() => {
    if (props.isComplete) setExpanded(false)
  })

  return (
    <div {...stylex.attrs(reasoningStyles.root)} aria-label="模型思考过程" data-tabora-thinking>
      <button
        {...stylex.attrs(reasoningStyles.toggle)}
        aria-expanded={expanded()}
        type="button"
        onClick={() => setExpanded((value) => !value)}
      >
        {expanded() ? (
          <ChevronDown {...stylex.attrs(reasoningStyles.chevron)} aria-hidden="true" />
        ) : (
          <ChevronRight {...stylex.attrs(reasoningStyles.chevron)} aria-hidden="true" />
        )}
        <Brain {...stylex.attrs(reasoningStyles.icon)} aria-hidden="true" />
        <span {...stylex.attrs(reasoningStyles.label)}>思考过程</span>
      </button>
      <Show when={expanded()}>
        <div {...stylex.attrs(reasoningStyles.content)}>{props.content}</div>
      </Show>
    </div>
  )
}
