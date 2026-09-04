import * as stylex from "@stylexjs/stylex"
import { ThinkingPart } from "@tanstack/ai-solid/ui"

import { styles } from "./styles"

/** Render only provider-supplied reasoning summaries; opaque signatures never reach this component. */
export function AiChatReasoning(props: { content: string; isComplete?: boolean }) {
  return (
    <div aria-label="模型思考过程" data-tabora-thinking>
      <ThinkingPart
        content={props.content}
        {...(props.isComplete === undefined ? {} : { isComplete: props.isComplete })}
        {...stylex.attrs(styles.reasoning)}
      />
    </div>
  )
}
