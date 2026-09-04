import * as stylex from "@stylexjs/stylex"
import { For, Show } from "solid-js"
import type { Accessor } from "solid-js"
import { createChatUI } from "@tanstack/ai-solid/ui"
import type { ChatUIHost } from "@tanstack/ai-solid/ui"
import type { UIMessage } from "@tanstack/ai-client"
import { IconButton } from "@tabora/ui/button"
import { Spinner } from "@tabora/ui/spinner"
import Check from "lucide-solid/icons/check"
import Copy from "lucide-solid/icons/copy"
import Pencil from "lucide-solid/icons/pencil"
import RefreshCw from "lucide-solid/icons/refresh-cw"
import { AssistantMarkdown } from "./ai-chat-markdown"
import { AiChatQueue } from "./ai-chat-queue"
import { AiChatReasoning } from "./ai-chat-reasoning"
import type { AiChatSession } from "./ai-chat-session"
import { AiChatUserMessage } from "./ai-chat-user-message"
import { styles } from "./styles"

const chatUi = createChatUI(
  {},
  {
    components: {
      // The host owns the outer message layout; this component only binds the
      // official Part dispatcher to Tabora's message content container.
      layout: (props) => <>{props.Messages}</>,
      message: (props) => (
        <div data-tabora-message-content>
          <props.Parts />
        </div>
      ),
    },
    partsComponents: {
      text: (props) => <AssistantMarkdown content={props.part.content} />,
      thinking: (props) => <AiChatReasoning content={props.part.content} />,
      // Unknown parts are intentionally ignored until a product renderer is
      // defined; protocol selection remains owned by TanStack AI.
      fallback: () => null,
    },
  },
)

export function AiChatMessageThread(props: {
  session: AiChatSession
  elapsed: Accessor<number>
  copiedMessageId: Accessor<string | null>
  onCopy: (message: UIMessage) => void | Promise<void>
  onEditLastUserMessage: () => void
  onAttach: (element: HTMLDivElement) => void
  onScroll: () => void
}) {
  // AiChatSession intentionally remains the source of truth for persistence,
  // queueing and lifecycle. The facade supplies the small UseChatReturn shape
  // consumed at runtime by createChatUI's Provider/Message components.
  const chatFacade = {
    messages: props.session.messages,
    queue: props.session.queuedMessages,
    cancelQueued: (id: string) => props.session.cancelQueued(id),
    interrupts: () => [],
  } as unknown as ChatUIHost<{}>

  const lastAssistantMessage = () =>
    [...props.session.messages()].reverse().find((message) => message.role === "assistant")

  return (
    <div
      {...stylex.attrs(styles.thread)}
      ref={props.onAttach}
      onScroll={props.onScroll}
      role="log"
      aria-live="polite"
      aria-label="AI 对话消息"
    >
      <For each={props.session.messages()}>
        {(message, index) => {
          const editable = () => {
            if (message.role !== "user" || props.session.isLoading()) return false
            // Editing currently replaces text through ChatClient; retain multimodal history intact.
            if (message.parts.some((part) => part.type !== "text")) return false
            const history = props.session.messages()
            const lastUserIndex = history.findLastIndex((item) => item.role === "user")
            return index() === lastUserIndex && lastUserIndex >= history.length - 2
          }
          return (
            <Show when={message.role === "user" || message.role === "assistant"}>
              <div
                {...stylex.attrs(
                  styles.turn,
                  message.role === "user" ? styles.turnUser : styles.turnAssistant,
                )}
              >
                <Show
                  when={message.role === "user"}
                  fallback={
                    <div {...stylex.attrs(styles.assistantMessageRow)}>
                      <div {...stylex.attrs(styles.assistantBubble)}>
                        <chatUi.Provider chat={chatFacade}>
                          <chatUi.Message message={message} />
                        </chatUi.Provider>
                      </div>
                      <div {...stylex.attrs(styles.messageActions)}>
                        <IconButton
                          size="sm"
                          variant="ghost"
                          aria-label={
                            props.copiedMessageId() === message.id ? "已复制回答" : "复制回答"
                          }
                          title={props.copiedMessageId() === message.id ? "已复制" : "复制回答"}
                          onClick={() => void props.onCopy(message)}
                        >
                          {props.copiedMessageId() === message.id ? (
                            <Check size={13} />
                          ) : (
                            <Copy size={13} />
                          )}
                        </IconButton>
                        <Show
                          when={
                            !props.session.isLoading() && lastAssistantMessage()?.id === message.id
                          }
                        >
                          <IconButton
                            size="sm"
                            variant="ghost"
                            aria-label="重新生成回答"
                            title="重新生成回答"
                            onClick={() => void props.session.retry()}
                          >
                            <RefreshCw size={13} />
                          </IconButton>
                        </Show>
                      </div>
                    </div>
                  }
                >
                  <div {...stylex.attrs(styles.userTurnRow)}>
                    <div {...stylex.attrs(styles.userBubble)}>
                      <AiChatUserMessage message={message} />
                    </div>
                    <Show when={editable()}>
                      <IconButton
                        size="sm"
                        variant="ghost"
                        aria-label="编辑这条提问并重新生成"
                        onClick={props.onEditLastUserMessage}
                      >
                        <Pencil size={12} />
                      </IconButton>
                    </Show>
                  </div>
                </Show>
              </div>
            </Show>
          )
        }}
      </For>
      <Show when={props.session.isLoading()}>
        <div {...stylex.attrs(styles.generatingRow)}>
          <Spinner size="sm" aria-label="生成中" />
          <span {...stylex.attrs(styles.generating)}>
            生成中 · {props.elapsed()} 秒
            <Show
              when={props.session.queuedCount() > 0}
            >{` · 已排队 ${props.session.queuedCount()} 条`}</Show>
          </span>
        </div>
      </Show>
      <AiChatQueue
        messages={props.session.queuedMessages()}
        onCancel={(id) => props.session.cancelQueued(id)}
      />
    </div>
  )
}
