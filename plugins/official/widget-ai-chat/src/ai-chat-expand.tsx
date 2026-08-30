import * as stylex from "@stylexjs/stylex"
import { createEffect, createSignal, For, Show } from "solid-js"
import { onMount } from "solid-js"
import type { JSX } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api/sdk"
import { ChatMessage } from "@tanstack/ai-solid-ui"
import { Button, IconButton } from "@tabora/ui/button"
import { Dialog } from "@tabora/ui/dialog"
import { Drawer } from "@tabora/ui/drawer"
import { EmptyState } from "@tabora/ui/empty-state"
import { InlineError } from "@tabora/ui/inline-error"
import { Input } from "@tabora/ui/input"
import { Textarea } from "@tabora/ui/textarea"
import MessageSquare from "lucide-solid/icons/message-square"
import Pencil from "lucide-solid/icons/pencil"
import Plus from "lucide-solid/icons/plus"
import Send from "lucide-solid/icons/send"
import Settings2 from "lucide-solid/icons/settings-2"
import Square from "lucide-solid/icons/square"
import Trash2 from "lucide-solid/icons/trash-2"
import { onCleanup } from "solid-js"
import {
  aiChatErrorCopy,
  getAiChatSession,
  getAiChatSettingsOpener,
  messageText,
  registerAiChatView,
} from "./ai-chat-session"
import type { AiChatConversationMeta, AiChatSession } from "./ai-chat-session"
import { AssistantMarkdown } from "./ai-chat-markdown"
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

function ConversationList(props: {
  session: AiChatSession
  onPick?: () => void
  onRename: (conversation: AiChatConversationMeta) => void
  onDelete: (conversation: AiChatConversationMeta) => void
  onOptions: (conversation: AiChatConversationMeta) => void
  compact?: boolean
}) {
  return (
    <>
      <div {...stylex.attrs(styles.sideHead)}>
        <Button
          variant="secondary"
          size="sm"
          xstyle={styles.newChatButton}
          onClick={() => {
            props.session.createConversation()
            props.onPick?.()
          }}
        >
          <Plus size={14} />
          新对话
        </Button>
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
                  <Show
                    when={!props.compact}
                    fallback={
                      <span {...stylex.attrs(styles.conversationMeta)}>
                        {conversation.messageCount} 条
                      </span>
                    }
                  >
                    <span {...stylex.attrs(styles.conversationMeta)}>
                      {conversation.messageCount} 条 · {formatRelativeTime(conversation.updatedAt)}
                    </span>
                  </Show>
                </button>
                <span {...stylex.attrs(styles.conversationActions)}>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    aria-label={`对话设置 ${conversation.title}`}
                    onClick={() => props.onOptions(conversation)}
                  >
                    <Settings2 size={12} />
                  </IconButton>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    aria-label={`重命名对话 ${conversation.title}`}
                    onClick={() => props.onRename(conversation)}
                  >
                    <Pencil size={12} />
                  </IconButton>
                  <IconButton
                    size="sm"
                    variant="ghost"
                    aria-label={`删除对话 ${conversation.title}`}
                    onClick={() => props.onDelete(conversation)}
                  >
                    <Trash2 size={12} />
                  </IconButton>
                </span>
              </div>
            )}
          </For>
        </div>
      </Show>
    </>
  )
}

export function AiChatExpand(props: WidgetViewProps) {
  const session = getAiChatSession({ instanceId: props.instanceId, data: props.data })
  const [draft, setDraft] = createSignal("")
  const [drawerOpen, setDrawerOpen] = createSignal(false)
  const [renaming, setRenaming] = createSignal<AiChatConversationMeta | null>(null)
  const [renameDraft, setRenameDraft] = createSignal("")
  const [deleting, setDeleting] = createSignal<AiChatConversationMeta | null>(null)
  const [optionsFor, setOptionsFor] = createSignal<AiChatConversationMeta | null>(null)
  const [promptDraft, setPromptDraft] = createSignal("")
  const [temperatureDraft, setTemperatureDraft] = createSignal("")
  const [temperatureInvalid, setTemperatureInvalid] = createSignal(false)
  const [editing, setEditing] = createSignal(false)
  let threadRef: HTMLDivElement | undefined
  let nearBottom = true

  onMount(() => {
    threadRef?.scrollTo({ top: threadRef.scrollHeight })
    const unregister = registerAiChatView({
      instanceId: props.instanceId,
      session,
      openExpand: () => props.host.openExpand(),
    })
    onCleanup(unregister)
  })

  createEffect(() => {
    void session.messages().length
    void session.isLoading()
    if (threadRef && nearBottom) threadRef.scrollTop = threadRef.scrollHeight
  })

  const trackScroll = () => {
    if (!threadRef) return
    const distance = threadRef.scrollHeight - threadRef.scrollTop - threadRef.clientHeight
    nearBottom = distance < 48
  }

  const attachThread = (element: HTMLDivElement) => {
    threadRef = element
  }

  const send = () => {
    const text = draft().trim()
    if (!text || session.isLoading()) return
    if (editing()) {
      setEditing(false)
      setDraft("")
      void session.editLastUserMessage(text)
      return
    }
    if (!session.activeId()) session.createConversation()
    nearBottom = true
    setDraft("")
    void session.send(text)
  }

  const startEditingLastUserMessage = () => {
    const history = session.messages()
    const lastUser = [...history].reverse().find((message) => message.role === "user")
    if (!lastUser || session.isLoading()) return
    setDraft(messageText(lastUser))
    setEditing(true)
  }

  const openConversationOptions = (conversation: AiChatConversationMeta) => {
    setPromptDraft(conversation.systemPrompt ?? "")
    setTemperatureDraft(
      conversation.temperature === undefined ? "" : String(conversation.temperature),
    )
    setTemperatureInvalid(false)
    setOptionsFor(conversation)
  }

  const saveConversationOptions = () => {
    const conversation = optionsFor()
    if (!conversation) return
    let temperature: number | undefined
    const rawTemperature = temperatureDraft().trim()
    if (rawTemperature) {
      const parsed = Number(rawTemperature)
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 2) {
        setTemperatureInvalid(true)
        return
      }
      temperature = parsed
    }
    session.updateConversationOptions(conversation.id, {
      systemPrompt: promptDraft(),
      temperature,
    })
    setOptionsFor(null)
  }

  const composer = (): JSX.Element => (
    <div {...stylex.attrs(styles.composerBar)}>
      <Show when={editing()}>
        <div {...stylex.attrs(styles.editBanner)}>
          <span {...stylex.attrs(styles.editBannerText)}>
            正在编辑最后一条提问，发送后将重新生成回答
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setEditing(false)
              setDraft("")
            }}
          >
            取消编辑
          </Button>
        </div>
      </Show>
      <div {...stylex.attrs(styles.composerRow)}>
        <Textarea
          xstyle={styles.composerTextarea}
          rows={2}
          value={draft()}
          onInput={setDraft}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
              event.preventDefault()
              send()
            }
          }}
          placeholder={
            editing()
              ? "编辑提问内容…（Enter 重新生成）"
              : "向 AI 提问…（Enter 发送，Shift+Enter 换行）"
          }
          aria-label="向 AI 提问"
        />
        <Show
          when={session.isLoading()}
          fallback={
            <IconButton
              size="lg"
              variant="primary"
              aria-label="发送"
              disabled={!draft().trim()}
              onClick={send}
            >
              <Send size={18} />
            </IconButton>
          }
        >
          <IconButton
            size="lg"
            variant="secondary"
            aria-label="停止生成"
            onClick={() => session.stop()}
          >
            <Square size={14} />
          </IconButton>
        </Show>
      </div>
    </div>
  )

  const errorCopy = () => aiChatErrorCopy(session.error())
  const openSettings = getAiChatSettingsOpener()
  const activeTitle = () =>
    session.conversations().find((conversation) => conversation.id === session.activeId())?.title ??
    "新对话"

  return (
    <div {...stylex.attrs(styles.expandRoot)}>
      <div {...stylex.attrs(styles.expandHeader)}>
        <IconButton
          size="sm"
          variant="ghost"
          xstyle={styles.historyToggle}
          aria-label="会话列表"
          onClick={() => setDrawerOpen(true)}
        >
          <MessageSquare size={14} />
        </IconButton>
        <span {...stylex.attrs(styles.activeTitle)}>
          {session.activeId() ? activeTitle() : "AI 对话"}
        </span>
      </div>
      <div {...stylex.attrs(styles.expandBody)}>
        <aside {...stylex.attrs(styles.side)}>
          <ConversationList
            session={session}
            onRename={setRenaming}
            onDelete={setDeleting}
            onOptions={openConversationOptions}
          />
        </aside>
        <Show
          when={session.activeId()}
          fallback={
            <div {...stylex.attrs(styles.empty)}>
              <EmptyState
                title="开始新的对话"
                description="在设置中心 AI 面板可查看和配置当前宿主可用的模型。"
                action={
                  <Button variant="primary" size="sm" onClick={() => session.createConversation()}>
                    新对话
                  </Button>
                }
              />
              {composer()}
            </div>
          }
        >
          <div {...stylex.attrs(styles.main)}>
            <div
              {...stylex.attrs(styles.thread)}
              ref={attachThread}
              onScroll={trackScroll}
              role="log"
              aria-live="polite"
              aria-label="AI 对话消息"
            >
              <For each={session.messages()}>
                {(message, index) => {
                  const editable = () => {
                    if (message.role !== "user" || session.isLoading()) return false
                    const history = session.messages()
                    let lastUserIndex = -1
                    for (let i = history.length - 1; i >= 0; i -= 1) {
                      if (history[i]?.role === "user") {
                        lastUserIndex = i
                        break
                      }
                    }
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
                        <span {...stylex.attrs(styles.roleLabel)}>
                          {message.role === "user" ? "我" : "AI"}
                        </span>
                        <Show
                          when={message.role === "user"}
                          fallback={
                            <div {...stylex.attrs(styles.assistantBubble)}>
                              <ChatMessage
                                message={message}
                                textPartRenderer={(part) => (
                                  <AssistantMarkdown content={part.content} />
                                )}
                              />
                            </div>
                          }
                        >
                          <div {...stylex.attrs(styles.userTurnRow)}>
                            <div {...stylex.attrs(styles.userBubble)}>{messageText(message)}</div>
                            <Show when={editable()}>
                              <IconButton
                                size="sm"
                                variant="ghost"
                                aria-label="编辑这条提问并重新生成"
                                onClick={startEditingLastUserMessage}
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
              <Show when={session.isLoading()}>
                <span {...stylex.attrs(styles.generating)}>正在生成…</span>
              </Show>
            </div>
            <Show when={session.error()}>
              <div {...stylex.attrs(styles.statusBar)}>
                <InlineError>
                  {errorCopy().title}：{errorCopy().hint}
                </InlineError>
                <Show when={session.error() && !session.isLoading()}>
                  <div {...stylex.attrs(styles.statusActions)}>
                    <Button variant="secondary" size="sm" onClick={() => void session.retry()}>
                      重试
                    </Button>
                    <Show when={openSettings && errorCopy().openSettings}>
                      <Button variant="ghost" size="sm" onClick={() => openSettings!("ai")}>
                        前往 AI 设置
                      </Button>
                    </Show>
                  </div>
                </Show>
              </div>
            </Show>
            <Show when={session.historyTrimmed() && !session.error()}>
              <div {...stylex.attrs(styles.noticeStrip)}>
                <span {...stylex.attrs(styles.notice)}>
                  已省略较早的消息，发送时会带上最近的对话。
                </span>
              </div>
            </Show>
            {composer()}
          </div>
        </Show>
      </div>
      <Drawer
        open={drawerOpen()}
        onClose={() => setDrawerOpen(false)}
        title="会话列表"
        side="left"
        size="sm"
      >
        <ConversationList
          session={session}
          compact
          onPick={() => setDrawerOpen(false)}
          onRename={(conversation) => {
            setDrawerOpen(false)
            setRenaming(conversation)
          }}
          onDelete={(conversation) => {
            setDrawerOpen(false)
            setDeleting(conversation)
          }}
          onOptions={(conversation) => {
            setDrawerOpen(false)
            openConversationOptions(conversation)
          }}
        />
      </Drawer>
      <Show when={renaming()}>
        {(conversation) => (
          <Dialog
            open
            title="重命名对话"
            onCancel={() => setRenaming(null)}
            onOk={() => {
              session.renameConversation(conversation().id, renameDraft())
              setRenaming(null)
            }}
            okText="保存"
          >
            <Input
              value={renameDraft()}
              onInput={setRenameDraft}
              aria-label="对话名称"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.isComposing) {
                  session.renameConversation(conversation().id, renameDraft())
                  setRenaming(null)
                }
              }}
            />
          </Dialog>
        )}
      </Show>
      <Show when={deleting()}>
        {(conversation) => (
          <Dialog
            open
            destructive
            title="删除对话"
            description={`将删除「${conversation().title}」及其 ${conversation().messageCount} 条消息，此操作无法恢复。`}
            onCancel={() => setDeleting(null)}
            footer={
              <>
                <Button variant="secondary" size="sm" onClick={() => setDeleting(null)}>
                  取消
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    session.deleteConversation(conversation().id)
                    setDeleting(null)
                  }}
                >
                  删除
                </Button>
              </>
            }
          />
        )}
      </Show>
      <Show when={optionsFor()}>
        {(conversation) => (
          <Dialog
            open
            title={`对话设置 · ${conversation().title}`}
            description="仅作用于当前对话；留空时使用默认值。"
            onCancel={() => setOptionsFor(null)}
            onOk={saveConversationOptions}
            okText="保存"
          >
            <div {...stylex.attrs(styles.optionsForm)}>
              <label {...stylex.attrs(styles.optionsLabel)}>
                <span {...stylex.attrs(styles.optionsLabelText)}>系统提示词</span>
                <Textarea
                  rows={4}
                  value={promptDraft()}
                  onInput={setPromptDraft}
                  placeholder="留空使用默认的工作台助手提示词"
                  aria-label="系统提示词"
                />
              </label>
              <label {...stylex.attrs(styles.optionsLabel)}>
                <span {...stylex.attrs(styles.optionsLabelText)}>温度（0–2，留空使用默认）</span>
                <Input
                  value={temperatureDraft()}
                  onInput={(value) => {
                    setTemperatureDraft(value)
                    setTemperatureInvalid(false)
                  }}
                  invalid={temperatureInvalid()}
                  aria-label="温度"
                  placeholder="例如 0.7"
                />
                <Show when={temperatureInvalid()}>
                  <span {...stylex.attrs(styles.optionsHint)}>温度需为 0 到 2 之间的数字</span>
                </Show>
              </label>
            </div>
          </Dialog>
        )}
      </Show>
    </div>
  )
}
