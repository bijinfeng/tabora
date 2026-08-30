import * as stylex from "@stylexjs/stylex"
import { createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js"
import type { JSX } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api/sdk"
import type { UIMessage } from "@tanstack/ai-client"
import { IconButton } from "@tabora/ui/button"
import { Input } from "@tabora/ui/input"
import Send from "lucide-solid/icons/send"
import Square from "lucide-solid/icons/square"
import { getAiChatSession, messageText, registerAiChatView } from "./ai-chat-session"
import { styles } from "./styles"

type PreviewTurn = { role: "user" | "assistant"; text: string }

function previewTurns(messages: UIMessage[]): PreviewTurn[] {
  const turns: PreviewTurn[] = []
  for (let index = messages.length - 1; index >= 0 && turns.length < 2; index -= 1) {
    const message = messages[index]
    if (!message || (message.role !== "user" && message.role !== "assistant")) continue
    if (turns.some((turn) => turn.role === message.role)) continue
    const text = messageText(message)
    if (!text) continue
    turns.unshift({ role: message.role, text })
  }
  return turns
}

export function AiChatCard(props: WidgetViewProps) {
  const session = getAiChatSession({ instanceId: props.instanceId, data: props.data })
  const [draft, setDraft] = createSignal("")
  const cardSize = () => props.size ?? "L"

  onMount(() => {
    const unregister = registerAiChatView({
      instanceId: props.instanceId,
      session,
      openExpand: () => props.host.openExpand(),
    })
    onCleanup(unregister)
  })

  const turns = createMemo(() => previewTurns(session.messages()))

  const send = () => {
    const text = draft().trim()
    if (!text || session.isLoading()) return
    if (!session.activeId()) session.createConversation()
    setDraft("")
    void session.send(text)
  }

  const composer = (): JSX.Element => (
    <div {...stylex.attrs(styles.composer)}>
      <Input
        xstyle={styles.composerInput}
        value={draft()}
        onInput={setDraft}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.isComposing) {
            event.preventDefault()
            send()
          }
        }}
        placeholder="向 AI 提问…"
        aria-label="向 AI 提问"
      />
      <Show
        when={session.isLoading()}
        fallback={
          <IconButton
            size="sm"
            variant="primary"
            aria-label="发送"
            disabled={!draft().trim()}
            onClick={send}
          >
            <Send size={14} />
          </IconButton>
        }
      >
        <IconButton
          size="sm"
          variant="secondary"
          aria-label="停止生成"
          onClick={() => session.stop()}
        >
          <Square size={12} />
        </IconButton>
      </Show>
    </div>
  )

  return (
    <>
      <Show when={cardSize() === "S"}>
        <div
          {...stylex.attrs(styles.small)}
          role="button"
          tabindex={0}
          onClick={() => props.host.openExpand()}
          onKeyDown={(event) => event.key === "Enter" && props.host.openExpand()}
        >
          <div {...stylex.attrs(styles.smallHead)}>
            <span {...stylex.attrs(styles.kicker)}>AI 对话</span>
            <span {...stylex.attrs(styles.smallState)}>
              {session.isLoading() ? "生成中" : "新提问"}
            </span>
          </div>
          <div {...stylex.attrs(styles.smallPreview, !turns().length && styles.smallPreviewEmpty)}>
            {turns().length ? turns()[turns().length - 1]!.text : "向 AI 提问，回答会显示在这里。"}
          </div>
          <div {...stylex.attrs(styles.smallFoot)}>
            <span {...stylex.attrs(styles.smallMeta)}>点击展开完整对话</span>
          </div>
        </div>
      </Show>

      <Show when={cardSize() !== "S"}>
        <div {...stylex.attrs(styles.card)}>
          <div {...stylex.attrs(styles.cardHead)}>
            <span {...stylex.attrs(styles.kicker)}>AI 对话</span>
            <span {...stylex.attrs(styles.cardState)}>{session.isLoading() ? "生成中…" : ""}</span>
          </div>
          <div {...stylex.attrs(styles.previewList)}>
            <Show
              when={turns().length}
              fallback={
                <div {...stylex.attrs(styles.previewEmpty)}>
                  提问会显示在这里，双击卡片可展开完整对话。
                </div>
              }
            >
              <For each={turns()}>
                {(turn) => (
                  <div
                    {...stylex.attrs(styles.previewBubble)}
                    role="button"
                    tabindex={0}
                    onClick={() => props.host.openExpand()}
                    onKeyDown={(event) => event.key === "Enter" && props.host.openExpand()}
                  >
                    <span {...stylex.attrs(styles.previewRole)}>
                      {turn.role === "user" ? "我" : "AI"}
                    </span>
                    <div {...stylex.attrs(styles.previewContent)}>{turn.text}</div>
                  </div>
                )}
              </For>
            </Show>
          </div>
          {composer()}
        </div>
      </Show>
    </>
  )
}
