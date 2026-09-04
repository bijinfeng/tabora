import * as stylex from "@stylexjs/stylex"
import { createSignal, For, Show } from "solid-js"
import { Button, IconButton } from "@tabora/ui/button"
import type { DropdownMenuTriggerRenderProps } from "@tabora/ui/dropdown-menu"
import { DropdownMenu } from "@tabora/ui/dropdown-menu"
import Ellipsis from "lucide-solid/icons/ellipsis"
import Eraser from "lucide-solid/icons/eraser"
import MessageSquare from "lucide-solid/icons/message-square"
import Pencil from "lucide-solid/icons/pencil"
import Settings2 from "lucide-solid/icons/settings-2"
import Trash2 from "lucide-solid/icons/trash-2"
import type { AiChatConversationMeta, AiChatSession } from "./ai-chat-session"
import { styles } from "./styles"

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return "刚刚"
  if (minutes < 60) return `${minutes}分钟前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}小时前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}天前`
  return new Date(iso).toLocaleDateString()
}

export function ConversationList(props: {
  session: AiChatSession
  onNew?: () => void
  onPick?: () => void
  onRename: (conversation: AiChatConversationMeta) => void
  onClear: (conversation: AiChatConversationMeta) => void
  onDelete: (conversation: AiChatConversationMeta) => void
  onOptions: (conversation: AiChatConversationMeta) => void
}) {
  const [hoveredId, setHoveredId] = createSignal<string | null>(null)
  const [focusedId, setFocusedId] = createSignal<string | null>(null)
  return (
    <>
      <div {...stylex.attrs(styles.sideHead)}>
        <Button
          variant="ghost"
          size="sm"
          xstyle={styles.newChatButton}
          onClick={() => {
            props.session.startNewConversation()
            props.onNew?.()
            props.onPick?.()
          }}
        >
          <MessageSquare size={14} />
          <span>新对话</span>
          <kbd {...stylex.attrs(styles.newChatShortcut)}>Ctrl+N</kbd>
        </Button>
        <span {...stylex.attrs(styles.sideHeading)}>历史对话</span>
      </div>
      <Show
        when={props.session.conversations().length}
        fallback={<div {...stylex.attrs(styles.sideEmpty)}>还没有历史对话。</div>}
      >
        <div {...stylex.attrs(styles.sideList)}>
          <For each={props.session.conversations()}>
            {(conversation) => (
              <div
                {...stylex.attrs(
                  styles.conversationRow,
                  conversation.id === props.session.activeId() && styles.conversationRowActive,
                )}
                onMouseEnter={() => setHoveredId(conversation.id)}
                onMouseLeave={() => setHoveredId(null)}
                onFocusIn={() => setFocusedId(conversation.id)}
                onFocusOut={() => setFocusedId(null)}
              >
                <button
                  type="button"
                  {...stylex.attrs(styles.conversationMain)}
                  onClick={() => {
                    props.session.switchConversation(conversation.id)
                    props.onPick?.()
                  }}
                  aria-label={`切换到对话 ${conversation.title}`}
                >
                  <span {...stylex.attrs(styles.conversationTitle)}>{conversation.title}</span>
                  <span
                    {...stylex.attrs(
                      styles.conversationMeta,
                      (hoveredId() === conversation.id || focusedId() === conversation.id) &&
                        styles.conversationMetaHidden,
                    )}
                  >
                    {formatRelativeTime(conversation.updatedAt)}
                  </span>
                </button>
                <span
                  {...stylex.attrs(
                    styles.conversationActions,
                    (hoveredId() === conversation.id || focusedId() === conversation.id) &&
                      styles.conversationActionsVisible,
                  )}
                >
                  <DropdownMenu
                    items={[
                      {
                        id: `${conversation.id}-options`,
                        label: "对话设置",
                        icon: <Settings2 size={14} />,
                        onClick: () => props.onOptions(conversation),
                      },
                      {
                        id: `${conversation.id}-rename`,
                        label: "重命名",
                        icon: <Pencil size={14} />,
                        onClick: () => props.onRename(conversation),
                      },
                      {
                        id: `${conversation.id}-clear`,
                        label: "清空消息",
                        icon: <Eraser size={14} />,
                        onClick: () => props.onClear(conversation),
                      },
                      { id: `${conversation.id}-separator`, label: <></>, separator: true },
                      {
                        id: `${conversation.id}-delete`,
                        label: "删除",
                        icon: <Trash2 size={14} />,
                        danger: true,
                        onClick: () => props.onDelete(conversation),
                      },
                    ]}
                    side="bottom"
                    align="end"
                    triggerAsChild={true}
                    triggerAriaLabel={`对话操作 ${conversation.title}`}
                    triggerTitle="对话操作"
                  >
                    {(trigger: DropdownMenuTriggerRenderProps) => {
                      const triggerProps = {
                        ...(trigger.ref !== undefined ? { ref: trigger.ref } : {}),
                        ...(trigger.disabled !== undefined ? { disabled: trigger.disabled } : {}),
                        ...(trigger["aria-haspopup"] !== undefined
                          ? { "aria-haspopup": "menu" as const }
                          : {}),
                        ...(trigger["aria-expanded"] !== undefined
                          ? { "aria-expanded": trigger["aria-expanded"] }
                          : {}),
                        ...(trigger["aria-controls"] !== undefined
                          ? { "aria-controls": trigger["aria-controls"] }
                          : {}),
                        ...(trigger["data-open"] !== undefined
                          ? { "data-open": trigger["data-open"] }
                          : {}),
                        ...(trigger["data-closed"] !== undefined
                          ? { "data-closed": trigger["data-closed"] }
                          : {}),
                        ...(trigger["data-kb-menu-value-trigger"] !== undefined
                          ? { "data-kb-menu-value-trigger": trigger["data-kb-menu-value-trigger"] }
                          : {}),
                        ...(trigger.onPointerDown !== undefined
                          ? { onPointerDown: trigger.onPointerDown }
                          : {}),
                        ...(trigger.onKeyDown !== undefined
                          ? { onKeyDown: trigger.onKeyDown }
                          : {}),
                        ...(trigger.onMouseOver !== undefined
                          ? { onMouseOver: trigger.onMouseOver }
                          : {}),
                        ...(trigger.onFocus !== undefined ? { onFocus: trigger.onFocus } : {}),
                      }
                      return (
                        <IconButton
                          {...triggerProps}
                          size="sm"
                          variant="ghost"
                          aria-label={`对话操作 ${conversation.title}`}
                        >
                          <Ellipsis size={14} />
                        </IconButton>
                      )
                    }}
                  </DropdownMenu>
                </span>
              </div>
            )}
          </For>
        </div>
      </Show>
    </>
  )
}
