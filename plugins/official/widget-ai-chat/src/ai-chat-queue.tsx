import * as stylex from "@stylexjs/stylex"
import { For, Show } from "solid-js"
import type { QueuedMessage } from "@tanstack/ai-client"
import { IconButton } from "@tabora/ui/button"
import X from "lucide-solid/icons/x"
import { styles } from "./styles"

function queuedMessageText(message: QueuedMessage): string {
  if (typeof message.content === "string") return message.content
  const content = message.content.content
  if (typeof content === "string") return content
  return content
    .filter((part) => part.type === "text")
    .map((part) => part.content)
    .join("")
}

/** Messages waiting for TanStack ChatClient's FIFO queue, cancellable before dispatch. */
export function AiChatQueue(props: { messages: QueuedMessage[]; onCancel: (id: string) => void }) {
  return (
    <Show when={props.messages.length > 0}>
      <div {...stylex.attrs(styles.queueList)} aria-label="待发送消息">
        <For each={props.messages}>
          {(message) => {
            const text = () => queuedMessageText(message).trim() || "附件消息"
            return (
              <div {...stylex.attrs(styles.queueItem)}>
                <span {...stylex.attrs(styles.queueItemText)} title={text()}>
                  已排队：{text()}
                </span>
                <IconButton
                  size="sm"
                  variant="ghost"
                  aria-label={`取消已排队消息：${text()}`}
                  title="取消这条消息"
                  onClick={() => props.onCancel(message.id)}
                >
                  <X size={12} />
                </IconButton>
              </div>
            )
          }}
        </For>
      </div>
    </Show>
  )
}
