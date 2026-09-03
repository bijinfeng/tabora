import * as stylex from "@stylexjs/stylex"
import { createEffect, createResource, createSignal, For, Show } from "solid-js"
import { onMount } from "solid-js"
import type { JSX } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api/sdk"
import { ChatMessage } from "@tanstack/ai-solid-ui"
import { Button, IconButton } from "@tabora/ui/button"
import { Dialog } from "@tabora/ui/dialog"
import { Drawer } from "@tabora/ui/drawer"
import type { DropdownMenuTriggerRenderProps } from "@tabora/ui/dropdown-menu"
import { DropdownMenu } from "@tabora/ui/dropdown-menu"
import { EmptyState } from "@tabora/ui/empty-state"
import { InlineError } from "@tabora/ui/inline-error"
import { Input } from "@tabora/ui/input"
import { Spinner } from "@tabora/ui/spinner"
import { Textarea } from "@tabora/ui/textarea"
import Brain from "lucide-solid/icons/brain"
import Cpu from "lucide-solid/icons/cpu"
import Ellipsis from "lucide-solid/icons/ellipsis"
import MessageSquare from "lucide-solid/icons/message-square"
import Paperclip from "lucide-solid/icons/paperclip"
import Pencil from "lucide-solid/icons/pencil"
import Plus from "lucide-solid/icons/plus"
import Send from "lucide-solid/icons/send"
import Settings2 from "lucide-solid/icons/settings-2"
import Square from "lucide-solid/icons/square"
import Trash2 from "lucide-solid/icons/trash-2"
import X from "lucide-solid/icons/x"
import { onCleanup } from "solid-js"
import {
  aiChatErrorCopy,
  getAiChatSession,
  getAiChatSettingsOpener,
  messageText,
  registerAiChatView,
} from "./ai-chat-session"
import type {
  AiChatContextBlock,
  AiChatConversationMeta,
  AiChatReasoningEffort,
  AiChatSession,
} from "./ai-chat-session"
import { AssistantMarkdown } from "./ai-chat-markdown"
import { styles } from "./styles"

const REASONING_LABELS: Record<AiChatReasoningEffort, string> = {
  low: "轻度",
  medium: "中度",
  high: "深度",
}

function newContextId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

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

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function ComposerChip(props: {
  trigger: DropdownMenuTriggerRenderProps
  label: string
  icon?: JSX.Element
  compact?: boolean
}) {
  const trigger = () => props.trigger
  return (
    <button
      type="button"
      {...stylex.attrs(styles.composerChip, props.compact && styles.composerContextButton)}
      ref={trigger().ref}
      disabled={trigger().disabled}
      aria-haspopup={trigger()["aria-haspopup"] ? "menu" : undefined}
      aria-expanded={trigger()["aria-expanded"]}
      aria-controls={trigger()["aria-controls"]}
      aria-label={trigger()["aria-label"]}
      title={trigger().title}
      data-open={trigger()["data-open"]}
      data-closed={trigger()["data-closed"]}
      data-kb-menu-value-trigger={trigger()["data-kb-menu-value-trigger"]}
      onPointerDown={trigger().onPointerDown}
      onKeyDown={trigger().onKeyDown}
      onMouseOver={trigger().onMouseOver}
      onFocus={trigger().onFocus}
    >
      {props.icon}
      <span {...stylex.attrs(props.compact && styles.composerContextLabel)}>{props.label}</span>
    </button>
  )
}

function ConversationList(props: {
  session: AiChatSession
  onPick?: () => void
  onRename: (conversation: AiChatConversationMeta) => void
  onDelete: (conversation: AiChatConversationMeta) => void
  onOptions: (conversation: AiChatConversationMeta) => void
}) {
  const [hoveredId, setHoveredId] = createSignal<string | null>(null)
  return (
    <>
      <div {...stylex.attrs(styles.sideHead)}>
        <Button
          variant="ghost"
          size="sm"
          xstyle={styles.newChatButton}
          onClick={() => {
            props.session.startNewConversation()
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
                  <span {...stylex.attrs(styles.conversationMeta)}>
                    {formatRelativeTime(conversation.updatedAt)}
                  </span>
                </button>
                <span
                  {...stylex.attrs(
                    styles.conversationActions,
                    hoveredId() === conversation.id && styles.conversationActionsVisible,
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
  const [elapsed, setElapsed] = createSignal(0)
  const [contextEditor, setContextEditor] = createSignal(false)
  const [contextLabel, setContextLabel] = createSignal("")
  const [contextText, setContextText] = createSignal("")
  const [attachments, setAttachments] = createSignal<File[]>([])
  let attachmentInput: HTMLInputElement | undefined

  const getAiSettings = props.host.getAiSettings?.bind(props.host)
  const [aiSettings] = createResource(
    () => (getAiSettings ? "load" : null),
    () => getAiSettings!(),
  )

  const activeConversation = () =>
    session.conversations().find((conversation) => conversation.id === session.activeId())

  const defaultModelId = () => {
    const settings = aiSettings()
    return settings?.activeProvider === "custom"
      ? settings.custom.model
      : (settings?.builtin.modelId ?? "")
  }
  const modelGroups = () => {
    const settings = aiSettings()
    if (!settings) return []
    const builtin = settings.builtin.models ?? []
    const customIds = settings.custom.models?.filter(Boolean) ?? []
    const custom = (
      customIds.length > 0 ? customIds : settings.custom.model ? [settings.custom.model] : []
    ).map((id) => ({ id, label: id }))
    const uniqueBuiltin = [...new Map(builtin.map((model) => [model.id, model])).values()]
    const uniqueCustom = [...new Map(custom.map((model) => [model.id, model])).values()]
    return [
      ...(uniqueBuiltin.length > 0
        ? [{ id: "builtin-models", label: "内置模型", items: uniqueBuiltin }]
        : []),
      ...(uniqueCustom.length > 0
        ? [
            {
              id: "custom-models",
              label: settings.custom.name?.trim() || "自定义供应商",
              items: uniqueCustom,
            },
          ]
        : []),
    ]
  }
  const modelChoices = () => modelGroups().flatMap((group) => group.items)
  const activeModelId = () => activeConversation()?.modelId || defaultModelId()
  const activeModelLabel = () => {
    const id = activeModelId()
    return modelChoices().find((model) => model.id === id)?.label ?? id ?? "默认模型"
  }
  const activeReasoning = (): AiChatReasoningEffort | undefined =>
    activeConversation()?.reasoningEffort
  const updateActiveOptions = (
    partial: Parameters<AiChatSession["updateConversationOptions"]>[1],
  ) => {
    const id = session.activeId()
    if (!id) return
    session.updateConversationOptions(id, partial)
  }

  const pickModel = (id: string) => {
    updateActiveOptions({ modelId: id === defaultModelId() ? undefined : id })
  }
  const pickReasoning = (value: AiChatReasoningEffort | undefined) => {
    updateActiveOptions({ reasoningEffort: value })
  }
  const contextBlocks = (): AiChatContextBlock[] => activeConversation()?.contextBlocks ?? []

  const addContextBlock = () => {
    const text = contextText().trim()
    if (!text) return
    const label = contextLabel().trim() || `上下文 ${contextBlocks().length + 1}`
    const next = [...contextBlocks(), { id: newContextId(), label, text }]
    updateActiveOptions({ contextBlocks: next })
    setContextLabel("")
    setContextText("")
  }

  const removeContextBlock = (id: string) => {
    const next = contextBlocks().filter((block) => block.id !== id)
    updateActiveOptions({ contextBlocks: next })
  }
  const handleAttachmentChange = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement
    const selected = input.files ? Array.from(input.files) : []
    if (selected.length > 0) setAttachments((current) => [...current, ...selected])
    input.value = ""
  }
  const removeAttachment = (index: number) => {
    setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }
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
    if (!session.isLoading()) return
    const startedAt = Date.now()
    setElapsed(0)
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startedAt) / 1000))
    }, 1000)
    onCleanup(() => clearInterval(timer))
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
      <div {...stylex.attrs(styles.composerShell)}>
        <Show when={attachments().length > 0}>
          <div {...stylex.attrs(styles.composerAttachmentList)} aria-label="已选择的附件">
            <For each={attachments()}>
              {(file, index) => (
                <div {...stylex.attrs(styles.composerAttachment)}>
                  <Paperclip size={14} />
                  <span {...stylex.attrs(styles.composerAttachmentName)} title={file.name}>
                    {file.name}
                  </span>
                  <span {...stylex.attrs(styles.composerAttachmentSize)}>
                    {formatFileSize(file.size)}
                  </span>
                  <button
                    type="button"
                    {...stylex.attrs(styles.composerAttachmentRemove)}
                    onClick={() => removeAttachment(index())}
                    aria-label={`移除附件 ${file.name}`}
                    title="移除附件"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </For>
          </div>
        </Show>
        <Textarea
          xstyle={styles.composerTextarea}
          rows={3}
          value={draft()}
          onInput={setDraft}
          onKeyDown={(event) => {
            if (event.isComposing) return
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              send()
            }
            if (event.key === "Escape" && editing()) {
              event.preventDefault()
              setEditing(false)
              setDraft("")
            }
          }}
          placeholder={
            editing()
              ? "编辑提问内容…（Enter 重新生成）"
              : "向 AI 提问…（Enter 发送，Shift+Enter 换行）"
          }
          aria-label="向 AI 提问"
        />
        <div {...stylex.attrs(styles.composerToolbar)}>
          <div {...stylex.attrs(styles.composerLeading)}>
            <DropdownMenu
              items={[
                {
                  id: "add-attachment",
                  label: "添加附件",
                  icon: <Paperclip size={14} />,
                  onClick: () => attachmentInput?.click(),
                },
              ]}
              side="top"
              align="start"
              triggerAsChild={true}
              triggerTitle="添加附件"
              triggerAriaLabel="添加附件"
            >
              {(trigger) => (
                <ComposerChip
                  trigger={trigger}
                  label="添加附件"
                  compact={true}
                  icon={<Plus size={16} />}
                />
              )}
            </DropdownMenu>
            <input
              ref={(element) => (attachmentInput = element)}
              type="file"
              {...stylex.attrs(styles.composerAttachmentInput)}
              aria-label="选择附件"
              onChange={handleAttachmentChange}
            />
          </div>
          <div {...stylex.attrs(styles.composerChips)}>
            <Show when={modelChoices().length > 0}>
              <DropdownMenu
                items={modelGroups().map((group) => ({
                  ...group,
                  items: group.items.map((model) => ({
                    ...model,
                    onClick: () => pickModel(model.id),
                    ...(model.id === activeModelId() ? { checked: true } : {}),
                  })),
                }))}
                side="top"
                align="start"
                triggerAsChild={true}
                triggerTitle="切换模型"
                triggerAriaLabel="切换模型"
              >
                {(trigger) => (
                  <ComposerChip
                    trigger={trigger}
                    label={activeModelLabel()}
                    icon={<Cpu size={12} />}
                  />
                )}
              </DropdownMenu>
            </Show>
            <DropdownMenu
              items={[
                {
                  id: "reasoning-auto",
                  label: "默认",
                  onClick: () => pickReasoning(undefined),
                  ...(activeReasoning() === undefined ? { checked: true } : {}),
                },
                { id: "reasoning-separator", label: <></>, separator: true },
                ...(["low", "medium", "high"] as AiChatReasoningEffort[]).map((value) => ({
                  id: `reasoning-${value}`,
                  label: REASONING_LABELS[value],
                  onClick: () => pickReasoning(value),
                  ...(activeReasoning() === value ? { checked: true } : {}),
                })),
              ]}
              side="top"
              align="start"
              triggerAsChild={true}
              triggerTitle="思考强度"
              triggerAriaLabel="思考强度"
            >
              {(trigger) => (
                <ComposerChip
                  trigger={trigger}
                  label={activeReasoning() ? REASONING_LABELS[activeReasoning()!] : "思考默认"}
                  icon={<Brain size={12} />}
                />
              )}
            </DropdownMenu>
          </div>
          <Show
            when={session.isLoading()}
            fallback={
              <IconButton
                size="md"
                variant="primary"
                xstyle={styles.composerSendButton}
                aria-label="发送"
                disabled={!draft().trim()}
                onClick={send}
              >
                <Send size={16} />
              </IconButton>
            }
          >
            <IconButton
              size="md"
              variant="secondary"
              xstyle={styles.composerSendButton}
              aria-label="停止生成"
              onClick={() => session.stop()}
            >
              <Square size={14} />
            </IconButton>
          </Show>
        </div>
      </div>
    </div>
  )

  const errorCopy = () => aiChatErrorCopy(session.error())
  const openSettings = getAiChatSettingsOpener()
  const activeTitle = () => activeConversation()?.title ?? "新对话"

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
              <div {...stylex.attrs(styles.emptyWelcome)}>
                <div {...stylex.attrs(styles.emptyWelcomeContent)}>
                  <EmptyState
                    title="接下来，交给我吧"
                    titleClass={stylex.attrs(styles.emptyTitle).class}
                  />
                  <div {...stylex.attrs(styles.emptyComposer)}>{composer()}</div>
                </div>
              </div>
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
                <div {...stylex.attrs(styles.generatingRow)}>
                  <Spinner size="sm" aria-label="生成中" />
                  <span {...stylex.attrs(styles.generating)}>生成中 · {elapsed()} 秒</span>
                </div>
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
      <Show when={contextEditor()}>
        <Dialog
          open
          title="添加上下文"
          description="上下文会以片段形式追加到系统提示词末尾，仅作用于当前对话。"
          onCancel={() => {
            setContextEditor(false)
            setContextLabel("")
            setContextText("")
          }}
          onOk={() => {
            addContextBlock()
            setContextEditor(false)
          }}
          okText="添加"
        >
          <div {...stylex.attrs(styles.optionsForm)}>
            <label {...stylex.attrs(styles.optionsLabel)}>
              <span {...stylex.attrs(styles.optionsLabelText)}>片段名称（可选）</span>
              <Input
                value={contextLabel()}
                onInput={setContextLabel}
                placeholder="例如：项目说明"
                aria-label="片段名称"
              />
            </label>
            <label {...stylex.attrs(styles.optionsLabel)}>
              <span {...stylex.attrs(styles.optionsLabelText)}>片段内容</span>
              <Textarea
                rows={6}
                value={contextText()}
                onInput={setContextText}
                placeholder="粘贴需要 AI 参考的资料、代码或说明"
                aria-label="片段内容"
              />
            </label>
            <Show when={contextBlocks().length > 0}>
              <div {...stylex.attrs(styles.contextList)}>
                <span {...stylex.attrs(styles.optionsLabelText)}>已添加的上下文</span>
                <For each={contextBlocks()}>
                  {(block) => (
                    <div {...stylex.attrs(styles.contextItem)}>
                      <div {...stylex.attrs(styles.contextItemMain)}>
                        <span {...stylex.attrs(styles.contextItemLabel)}>{block.label}</span>
                        <span {...stylex.attrs(styles.contextItemPreview)}>
                          {block.text.slice(0, 60)}
                          {block.text.length > 60 ? "…" : ""}
                        </span>
                      </div>
                      <IconButton
                        size="sm"
                        variant="ghost"
                        aria-label={`删除上下文 ${block.label}`}
                        onClick={() => removeContextBlock(block.id)}
                      >
                        <X size={12} />
                      </IconButton>
                    </div>
                  )}
                </For>
              </div>
            </Show>
          </div>
        </Dialog>
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
