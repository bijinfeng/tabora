import * as stylex from "@stylexjs/stylex"
import { createEffect, createResource, createSignal, For, Show } from "solid-js"
import { onMount } from "solid-js"
import type { JSX } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api/sdk"
import type { AiChatAttachmentResource } from "@tabora/plugin-api/sdk"
import type { UIMessage } from "@tanstack/ai-client"
import { Button, IconButton } from "@tabora/ui/button"
import { Drawer } from "@tabora/ui/drawer"
import type { DropdownMenuTriggerRenderProps } from "@tabora/ui/dropdown-menu"
import { DropdownMenu } from "@tabora/ui/dropdown-menu"
import { EmptyState } from "@tabora/ui/empty-state"
import { InlineError } from "@tabora/ui/inline-error"
import { Textarea } from "@tabora/ui/textarea"
import Brain from "lucide-solid/icons/brain"
import Cpu from "lucide-solid/icons/cpu"
import MessageSquare from "lucide-solid/icons/message-square"
import Paperclip from "lucide-solid/icons/paperclip"
import Plus from "lucide-solid/icons/plus"
import Send from "lucide-solid/icons/send"
import Settings2 from "lucide-solid/icons/settings-2"
import Square from "lucide-solid/icons/square"
import X from "lucide-solid/icons/x"
import { onCleanup } from "solid-js"
import {
  aiChatErrorCopy,
  getAiChatSession,
  getAiChatSettingsOpener,
  messageText,
  prepareAiChatAttachments,
  registerAiChatView,
} from "./ai-chat-session"
import type {
  AiChatContextBlock,
  AiChatConversationMeta,
  AiChatReasoningEffort,
  AiChatSession,
} from "./ai-chat-session"
import {
  buildAttachmentContent,
  formatFileSize,
  type AiChatInputModality,
} from "./ai-chat-attachments"
import { ConversationList } from "./ai-chat-conversation-list"
import { AiChatDialogs } from "./ai-chat-dialogs"
import { AiChatMessageThread } from "./ai-chat-message-thread"
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

export function AiChatExpand(props: WidgetViewProps) {
  const session = getAiChatSession({ instanceId: props.instanceId, data: props.data })
  const [draft, setDraft] = createSignal("")
  const [drawerOpen, setDrawerOpen] = createSignal(false)
  const [renaming, setRenaming] = createSignal<AiChatConversationMeta | null>(null)
  const [renameDraft, setRenameDraft] = createSignal("")
  const [clearing, setClearing] = createSignal<AiChatConversationMeta | null>(null)
  const [deleting, setDeleting] = createSignal<AiChatConversationMeta | null>(null)
  const [optionsFor, setOptionsFor] = createSignal<AiChatConversationMeta | null>(null)
  const [promptDraft, setPromptDraft] = createSignal("")
  const [temperatureDraft, setTemperatureDraft] = createSignal("")
  const [temperatureInvalid, setTemperatureInvalid] = createSignal(false)
  const [maxOutputTokensDraft, setMaxOutputTokensDraft] = createSignal("")
  const [maxOutputTokensInvalid, setMaxOutputTokensInvalid] = createSignal(false)
  const [editing, setEditing] = createSignal(false)
  const [elapsed, setElapsed] = createSignal(0)
  const [contextEditor, setContextEditor] = createSignal(false)
  const [contextLabel, setContextLabel] = createSignal("")
  const [contextText, setContextText] = createSignal("")
  const [attachments, setAttachments] = createSignal<File[]>([])
  const [copiedMessageId, setCopiedMessageId] = createSignal<string | null>(null)
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
    ).map((id) => ({
      id,
      label: id,
      inputModalities: settings.custom.inputModalities ?? ["text", "image"],
    }))
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
  const activeModelInputModalities = (): AiChatInputModality[] =>
    modelChoices().find((model) => model.id === activeModelId())?.inputModalities ?? [
      "text",
      "image",
    ]
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

  const send = async (immediately = false) => {
    const text = draft().trim()
    const selectedAttachments = attachments()
    if (!text && selectedAttachments.length === 0) return
    if (editing()) {
      if (!text) return
      setEditing(false)
      setDraft("")
      void session.editLastUserMessage(text)
      return
    }
    if (!session.activeId()) session.createConversation()
    const conversationId = session.activeId()
    if (!conversationId) return
    nearBottom = true
    setDraft("")
    setAttachments([])
    const prompt = text || "请分析我附上的文件。"
    let resources: AiChatAttachmentResource[] = []
    try {
      resources = await prepareAiChatAttachments(selectedAttachments, conversationId)
    } catch {
      // The sent message renders each failed resource as unavailable; native
      // image/audio/PDF parts can still use their normal model path.
    }
    const attachmentContent = await buildAttachmentContent(
      prompt,
      selectedAttachments,
      activeModelInputModalities(),
      resources,
    )
    void (immediately
      ? session.sendImmediately(attachmentContent)
      : session.send(attachmentContent))
  }

  const startEditingLastUserMessage = () => {
    const history = session.messages()
    const lastUser = [...history].reverse().find((message) => message.role === "user")
    if (!lastUser || session.isLoading()) return
    setDraft(messageText(lastUser))
    setEditing(true)
  }

  const copyAssistantMessage = async (message: UIMessage) => {
    const text = messageText(message).trim()
    if (!text || typeof navigator === "undefined" || !navigator.clipboard?.writeText) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(message.id)
      window.setTimeout(() => {
        setCopiedMessageId((current) => (current === message.id ? null : current))
      }, 1600)
    } catch {
      // Clipboard access can be denied by the browser; leave the conversation intact.
    }
  }

  const openConversationOptions = (conversation: AiChatConversationMeta) => {
    setPromptDraft(conversation.systemPrompt ?? "")
    setTemperatureDraft(
      conversation.temperature === undefined ? "" : String(conversation.temperature),
    )
    setTemperatureInvalid(false)
    setMaxOutputTokensDraft(
      conversation.maxOutputTokens === undefined ? "" : String(conversation.maxOutputTokens),
    )
    setMaxOutputTokensInvalid(false)
    setOptionsFor(conversation)
  }

  const saveConversationOptions = () => {
    const conversation = optionsFor()
    if (!conversation) return
    let temperature: number | undefined
    let maxOutputTokens: number | undefined
    const rawTemperature = temperatureDraft().trim()
    if (rawTemperature) {
      const parsed = Number(rawTemperature)
      if (!Number.isFinite(parsed) || parsed < 0 || parsed > 2) {
        setTemperatureInvalid(true)
        return
      }
      temperature = parsed
    }
    const rawMaxOutputTokens = maxOutputTokensDraft().trim()
    if (rawMaxOutputTokens) {
      const parsed = Number(rawMaxOutputTokens)
      if (!Number.isInteger(parsed) || parsed < 1 || parsed > 8_192) {
        setMaxOutputTokensInvalid(true)
        return
      }
      maxOutputTokens = parsed
    }
    session.updateConversationOptions(conversation.id, {
      systemPrompt: promptDraft(),
      temperature,
      maxOutputTokens,
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
              void send(event.ctrlKey || event.metaKey)
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
              : "向 AI 提问…（Enter 发送，Ctrl+Enter 立即发送）"
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
                {
                  id: "edit-context",
                  label: "管理上下文",
                  icon: <Settings2 size={14} />,
                  onClick: () => setContextEditor(true),
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
          <div {...stylex.attrs(styles.composerRunActions)}>
            <IconButton
              size="md"
              variant="primary"
              xstyle={styles.composerSendButton}
              aria-label="发送"
              title={session.isLoading() ? "加入发送队列" : "发送"}
              disabled={!draft().trim() && attachments().length === 0}
              onClick={() => void send()}
            >
              <Send size={16} />
            </IconButton>
            <Show when={session.isLoading()}>
              <IconButton
                size="md"
                variant="secondary"
                xstyle={styles.composerSendButton}
                aria-label="停止生成"
                title="停止生成并取消已排队消息"
                onClick={() => session.stop()}
              >
                <Square size={14} />
              </IconButton>
            </Show>
          </div>
        </div>
      </div>
    </div>
  )

  const errorCopy = () => aiChatErrorCopy(session.error())
  const openSettings = getAiChatSettingsOpener()
  const activeTitle = () => activeConversation()?.title ?? "新对话"
  const resetComposerForNewConversation = () => {
    setDraft("")
    setAttachments([])
    setEditing(false)
  }

  return (
    <div
      {...stylex.attrs(styles.expandRoot)}
      onKeyDown={(event) => {
        if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== "n") return
        if (event.isComposing) return
        event.preventDefault()
        session.startNewConversation()
        resetComposerForNewConversation()
      }}
    >
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
            onNew={resetComposerForNewConversation}
            onRename={setRenaming}
            onClear={setClearing}
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
            <AiChatMessageThread
              session={session}
              elapsed={elapsed}
              copiedMessageId={copiedMessageId}
              onCopy={copyAssistantMessage}
              onEditLastUserMessage={startEditingLastUserMessage}
              onAttach={attachThread}
              onScroll={trackScroll}
            />
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
          onNew={() => {
            resetComposerForNewConversation()
            setDrawerOpen(false)
          }}
          onPick={() => setDrawerOpen(false)}
          onRename={(conversation) => {
            setDrawerOpen(false)
            setRenaming(conversation)
          }}
          onClear={(conversation) => {
            setDrawerOpen(false)
            setClearing(conversation)
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
      <AiChatDialogs
        session={session}
        renaming={renaming}
        setRenaming={setRenaming}
        renameDraft={renameDraft}
        setRenameDraft={setRenameDraft}
        clearing={clearing}
        setClearing={setClearing}
        deleting={deleting}
        setDeleting={setDeleting}
        contextEditor={contextEditor}
        setContextEditor={setContextEditor}
        contextLabel={contextLabel}
        setContextLabel={setContextLabel}
        contextText={contextText}
        setContextText={setContextText}
        contextBlocks={contextBlocks}
        onAddContext={addContextBlock}
        onRemoveContext={removeContextBlock}
        optionsFor={optionsFor}
        setOptionsFor={setOptionsFor}
        promptDraft={promptDraft}
        setPromptDraft={setPromptDraft}
        temperatureDraft={temperatureDraft}
        setTemperatureDraft={setTemperatureDraft}
        temperatureInvalid={temperatureInvalid}
        setTemperatureInvalid={setTemperatureInvalid}
        maxOutputTokensDraft={maxOutputTokensDraft}
        setMaxOutputTokensDraft={setMaxOutputTokensDraft}
        maxOutputTokensInvalid={maxOutputTokensInvalid}
        setMaxOutputTokensInvalid={setMaxOutputTokensInvalid}
        onSaveOptions={saveConversationOptions}
      />
    </div>
  )
}
