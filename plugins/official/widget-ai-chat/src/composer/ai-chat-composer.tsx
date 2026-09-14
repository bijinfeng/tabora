import * as stylex from "@stylexjs/stylex"
import { createEffect, createResource, createSignal, For, Show } from "solid-js"
import type { JSX } from "solid-js"
import type { AiChatAttachmentResource, SettingsAiSettings } from "@tabora/plugin-api/sdk"
import type {
  DropdownMenuEntry,
  DropdownMenuItem,
  DropdownMenuTriggerRenderProps,
} from "@tabora/ui/dropdown-menu"
import { Button, IconButton } from "@tabora/ui/button"
import { DropdownMenu } from "@tabora/ui/dropdown-menu"
import { Textarea } from "@tabora/ui/textarea"
import Cpu from "lucide-solid/icons/cpu"
import Eraser from "lucide-solid/icons/eraser"
import MessageSquarePlus from "lucide-solid/icons/message-square-plus"
import Minimize2 from "lucide-solid/icons/minimize-2"
import Paperclip from "lucide-solid/icons/paperclip"
import Plus from "lucide-solid/icons/plus"
import Send from "lucide-solid/icons/send"
import Settings2 from "lucide-solid/icons/settings-2"
import Square from "lucide-solid/icons/square"
import X from "lucide-solid/icons/x"
import { buildAttachmentContent, formatFileSize } from "../ai-chat-attachments"
import type { AiChatInputModality } from "../ai-chat-attachments"
import { estimateContextUsage, prepareAiChatAttachments } from "../conversation/ai-chat-session"
import type {
  AiChatConversationMeta,
  AiChatReasoningEffort,
  AiChatSession,
} from "../conversation/ai-chat-session"
import { contextUsageStyles } from "./ai-chat-context-usage.styles"
import { composerStyles } from "./ai-chat-composer.styles"
import { AiChatSlashMenu } from "./ai-chat-slash-menu"

const REASONING_LABELS: Record<AiChatReasoningEffort, string> = {
  low: "轻度",
  medium: "中度",
  high: "深度",
}
const CONTEXT_RING_RADIUS = 8
const CONTEXT_RING_CIRCUMFERENCE = 2 * Math.PI * CONTEXT_RING_RADIUS

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
      {...stylex.attrs(
        composerStyles.composerChip,
        props.compact && composerStyles.composerContextButton,
      )}
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
      <span {...stylex.attrs(props.compact && composerStyles.composerContextLabel)}>
        {props.label}
      </span>
    </button>
  )
}

export type AiChatComposerController = {
  editLastUserMessage(text: string): void
}

/** Input-local controls, model choices and attachment preparation stay with the composer. */
export function AiChatComposer(props: {
  session: AiChatSession
  getAiSettings?: () => Promise<SettingsAiSettings>
  onClear: (conversation: AiChatConversationMeta) => void
  onOpenContextEditor: () => void
  onController: (controller: AiChatComposerController) => void
}) {
  const [draft, setDraft] = createSignal("")
  const [attachments, setAttachments] = createSignal<File[]>([])
  const [editing, setEditing] = createSignal(false)
  const [pendingModelId, setPendingModelId] = createSignal<string | null>(null)
  const [contextDetailsOpen, setContextDetailsOpen] = createSignal(false)
  const [slashMenuOpen, setSlashMenuOpen] = createSignal(false)
  const [slashModelPicker, setSlashModelPicker] = createSignal(false)
  const [slashActiveIndex, setSlashActiveIndex] = createSignal(0)
  let attachmentInput: HTMLInputElement | undefined
  let contextProgressRef: SVGCircleElement | undefined
  const [aiSettings] = createResource(
    () => (props.getAiSettings ? "load" : null),
    () => props.getAiSettings!(),
  )

  const activeConversation = () =>
    props.session
      .conversations()
      .find((conversation) => conversation.id === props.session.activeId())
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
  const activeModelId = () => activeConversation()?.modelId || pendingModelId() || defaultModelId()
  const activeModelLabel = () => {
    const id = activeModelId()
    return modelChoices().find((model) => model.id === id)?.label ?? id ?? "默认模型"
  }
  const activeModelInputModalities = (): AiChatInputModality[] =>
    modelChoices().find((model) => model.id === activeModelId())?.inputModalities ?? [
      "text",
      "image",
    ]
  const activeModelReasoning = () =>
    modelChoices().find((model) => model.id === activeModelId())?.reasoning
  const activeReasoning = (): AiChatReasoningEffort | undefined =>
    activeConversation()?.reasoningEffort
  const updateActiveOptions = (
    partial: Parameters<AiChatSession["updateConversationOptions"]>[1],
  ) => {
    const id = props.session.activeId()
    if (id) props.session.updateConversationOptions(id, partial)
  }
  const pickModel = (id: string) => {
    const modelId = id === defaultModelId() ? "" : id
    setPendingModelId(modelId)
    if (props.session.activeId()) {
      updateActiveOptions({ modelId: modelId || undefined })
      setPendingModelId(null)
    }
  }
  const pickReasoning = (value: AiChatReasoningEffort | undefined) =>
    updateActiveOptions({ reasoningEffort: value })
  const modelSubmenu = (): DropdownMenuEntry[] =>
    modelGroups().map((group) => ({
      id: group.id,
      label: group.label,
      items: group.items.map(
        (model) =>
          ({
            id: model.id,
            label: model.label,
            onClick: () => pickModel(model.id),
            ...(model.id === activeModelId() ? { checked: true } : {}),
          }) satisfies DropdownMenuItem,
      ),
    }))
  const reasoningSubmenu = (): DropdownMenuEntry[] => [
    {
      id: "reasoning-auto",
      label: "默认",
      onClick: () => pickReasoning(undefined),
      ...(activeReasoning() === undefined ? { checked: true } : {}),
    },
    { id: "reasoning-separator", label: <></>, separator: true },
    ...(["low", "medium", "high"] as AiChatReasoningEffort[]).map(
      (value) =>
        ({
          id: `reasoning-${value}`,
          label: REASONING_LABELS[value],
          onClick: () => pickReasoning(value),
          ...(activeReasoning() === value ? { checked: true } : {}),
        }) satisfies DropdownMenuItem,
    ),
  ]
  const modelAndReasoningMenu = (): DropdownMenuItem[] => [
    ...(modelChoices().length > 0
      ? [
          {
            id: "model-selector",
            label: "模型",
            trailing: activeModelLabel(),
            submenu: modelSubmenu(),
          } satisfies DropdownMenuItem,
        ]
      : []),
    ...(activeModelReasoning()?.effort
      ? [
          {
            id: "reasoning-selector",
            label: "推理等级",
            trailing: activeReasoning() ? REASONING_LABELS[activeReasoning()!] : "默认",
            submenu: reasoningSubmenu(),
          } satisfies DropdownMenuItem,
        ]
      : []),
  ]
  const contextUsage = () =>
    estimateContextUsage(activeConversation(), props.session.messages(), draft())
  const closeSlashMenu = () => {
    setSlashMenuOpen(false)
    setSlashModelPicker(false)
    setSlashActiveIndex(0)
  }
  const reset = () => {
    setDraft("")
    setAttachments([])
    setEditing(false)
    closeSlashMenu()
  }
  createEffect(() => {
    if (!props.session.activeId()) reset()
  })
  createEffect(() => {
    const element = contextProgressRef
    if (element) {
      element.setAttribute(
        "stroke-dashoffset",
        String(CONTEXT_RING_CIRCUMFERENCE * (1 - contextUsage().percent / 100)),
      )
    }
  })
  const handleDraftInput = (value: string) => {
    setDraft(value)
    setSlashModelPicker(false)
    setSlashMenuOpen(value.startsWith("/"))
    setSlashActiveIndex(0)
  }
  const slashQuery = () => draft().slice(1).trim().toLocaleLowerCase()
  const slashCommands = () => {
    const commands = [
      {
        id: "compact",
        label: props.session.isCompressing() ? "正在压缩上下文" : "压缩上下文",
        description: `压缩此聊天的上下文（已使用 ${contextUsage().percent}%）`,
        icon: <Minimize2 size={16} />,
        disabled:
          props.session.isLoading() ||
          props.session.isCompressing() ||
          props.session.messages().length <= 4,
        onSelect: () => {
          setDraft("")
          closeSlashMenu()
          void props.session.compressContext()
        },
      },
      {
        id: "new",
        label: "新建对话",
        description: "开始一个不带历史上下文的新对话",
        icon: <MessageSquarePlus size={16} />,
        disabled: false,
        onSelect: () => {
          props.session.startNewConversation()
          reset()
        },
      },
      {
        id: "model",
        label: "切换模型",
        description: `当前：${activeModelLabel()}`,
        icon: <Cpu size={16} />,
        disabled: modelChoices().length === 0,
        onSelect: () => {
          setSlashModelPicker(true)
          setSlashActiveIndex(0)
        },
      },
      {
        id: "clear",
        label: "清空当前对话",
        description: "删除所有消息，保留对话设置",
        icon: <Eraser size={16} />,
        disabled:
          !activeConversation() ||
          props.session.messages().length === 0 ||
          props.session.isLoading(),
        onSelect: () => {
          const conversation = activeConversation()
          if (conversation) props.onClear(conversation)
          setDraft("")
          closeSlashMenu()
        },
      },
    ]
    const query = slashQuery()
    return query
      ? commands.filter((command) => command.label.toLocaleLowerCase().includes(query))
      : commands
  }
  const moveSlashSelection = (direction: 1 | -1) => {
    const count = slashModelPicker() ? modelChoices().length : slashCommands().length
    if (count === 0) return
    setSlashActiveIndex((index) => (index + direction + count) % count)
  }
  const selectSlashItem = () => {
    if (slashModelPicker()) {
      const model = modelChoices()[slashActiveIndex()]
      if (!model) return
      pickModel(model.id)
      setDraft("")
      closeSlashMenu()
      return
    }
    const command = slashCommands()[slashActiveIndex()]
    if (!command?.disabled) command?.onSelect()
  }
  const handleAttachmentChange = (event: Event) => {
    const input = event.currentTarget as HTMLInputElement
    const selected = input.files ? Array.from(input.files) : []
    if (selected.length > 0) setAttachments((current) => [...current, ...selected])
    input.value = ""
  }
  const removeAttachment = (index: number) =>
    setAttachments((current) => current.filter((_, itemIndex) => itemIndex !== index))
  const send = async (immediately = false) => {
    const text = draft().trim()
    const selectedAttachments = attachments()
    if (!text && selectedAttachments.length === 0) return
    if (editing()) {
      if (!text) return
      reset()
      void props.session.editLastUserMessage(text)
      return
    }
    if (!props.session.activeId()) props.session.createConversation()
    const selectedModelId = pendingModelId()
    if (selectedModelId !== null) {
      updateActiveOptions({ modelId: selectedModelId || undefined })
      setPendingModelId(null)
    }
    const conversationId = props.session.activeId()
    if (!conversationId) return
    setDraft("")
    setAttachments([])
    const prompt = text || "请分析我附上的文件。"
    let resources: AiChatAttachmentResource[] = []
    try {
      resources = await prepareAiChatAttachments(selectedAttachments, conversationId)
    } catch {
      // Failed resources remain unavailable in the sent message; native parts still work.
    }
    const content = await buildAttachmentContent(
      prompt,
      selectedAttachments,
      activeModelInputModalities(),
      resources,
    )
    void (immediately ? props.session.sendImmediately(content) : props.session.send(content))
  }
  props.onController({
    editLastUserMessage(text) {
      if (props.session.isLoading()) return
      setDraft(text)
      setEditing(true)
    },
  })

  return (
    <div {...stylex.attrs(composerStyles.composerBar)}>
      <Show when={editing()}>
        <div {...stylex.attrs(composerStyles.editBanner)}>
          <span {...stylex.attrs(composerStyles.editBannerText)}>
            正在编辑最后一条提问，发送后将重新生成回答
          </span>
          <Button variant="ghost" size="sm" onClick={reset}>
            取消编辑
          </Button>
        </div>
      </Show>
      <div {...stylex.attrs(composerStyles.composerShell)}>
        <Show when={attachments().length > 0}>
          <div {...stylex.attrs(composerStyles.composerAttachmentList)} aria-label="已选择的附件">
            <For each={attachments()}>
              {(file, index) => (
                <div {...stylex.attrs(composerStyles.composerAttachment)}>
                  <Paperclip size={14} />
                  <span {...stylex.attrs(composerStyles.composerAttachmentName)} title={file.name}>
                    {file.name}
                  </span>
                  <span {...stylex.attrs(composerStyles.composerAttachmentSize)}>
                    {formatFileSize(file.size)}
                  </span>
                  <button
                    type="button"
                    {...stylex.attrs(composerStyles.composerAttachmentRemove)}
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
        <AiChatSlashMenu
          open={slashMenuOpen}
          modelPicker={slashModelPicker}
          modelGroups={modelGroups}
          activeModelId={activeModelId}
          activeIndex={slashActiveIndex}
          commands={slashCommands}
          onPickModel={(id) => {
            pickModel(id)
            setDraft("")
            closeSlashMenu()
          }}
        />
        <Textarea
          xstyle={composerStyles.composerTextarea}
          rows={3}
          value={draft()}
          onInput={handleDraftInput}
          onKeyDown={(event) => {
            if (event.isComposing) return
            if (slashMenuOpen() && event.key === "ArrowDown") {
              event.preventDefault()
              moveSlashSelection(1)
              return
            }
            if (slashMenuOpen() && event.key === "ArrowUp") {
              event.preventDefault()
              moveSlashSelection(-1)
              return
            }
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault()
              if (slashMenuOpen()) selectSlashItem()
              else void send(event.ctrlKey || event.metaKey)
            }
            if (event.key === "Escape" && slashMenuOpen()) {
              event.preventDefault()
              setDraft("")
              closeSlashMenu()
            } else if (event.key === "Escape" && editing()) {
              event.preventDefault()
              reset()
            }
          }}
          placeholder={
            editing()
              ? "编辑提问内容…（Enter 重新生成）"
              : "向 AI 提问…（Enter 发送，Ctrl+Enter 立即发送）"
          }
          aria-label="向 AI 提问"
        />
        <div {...stylex.attrs(composerStyles.composerToolbar)}>
          <div {...stylex.attrs(composerStyles.composerLeading)}>
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
                  onClick: props.onOpenContextEditor,
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
              {...stylex.attrs(composerStyles.composerAttachmentInput)}
              aria-label="选择附件"
              onChange={handleAttachmentChange}
            />
          </div>
          <div {...stylex.attrs(composerStyles.composerChips)}>
            <div {...stylex.attrs(contextUsageStyles.meter)}>
              <div
                {...stylex.attrs(contextUsageStyles.indicator)}
                tabIndex={0}
                aria-label={`上下文窗口已使用 ${contextUsage().percent}%`}
                onPointerEnter={() => setContextDetailsOpen(true)}
                onPointerLeave={() => setContextDetailsOpen(false)}
                onFocus={() => setContextDetailsOpen(true)}
                onBlur={() => setContextDetailsOpen(false)}
              >
                <svg
                  {...stylex.attrs(contextUsageStyles.ring)}
                  viewBox="0 0 22 22"
                  aria-hidden="true"
                >
                  <circle
                    {...stylex.attrs(contextUsageStyles.ringTrack)}
                    cx="11"
                    cy="11"
                    r={CONTEXT_RING_RADIUS}
                  />
                  <circle
                    {...stylex.attrs(contextUsageStyles.ringProgress)}
                    ref={(element) => {
                      contextProgressRef = element
                      element.setAttribute("stroke-dasharray", String(CONTEXT_RING_CIRCUMFERENCE))
                    }}
                    cx="11"
                    cy="11"
                    r={CONTEXT_RING_RADIUS}
                    transform="rotate(-90 11 11)"
                  />
                </svg>
                <span {...stylex.attrs(contextUsageStyles.percent)}>{contextUsage().percent}%</span>
                <Show when={contextDetailsOpen()}>
                  <div {...stylex.attrs(contextUsageStyles.tooltip)} role="status">
                    <strong {...stylex.attrs(contextUsageStyles.tooltipTitle)}>上下文窗口</strong>
                    <span {...stylex.attrs(contextUsageStyles.tooltipValue)}>
                      约 {contextUsage().usedTokens.toLocaleString()} /{" "}
                      {contextUsage().windowTokens.toLocaleString()} tokens
                    </span>
                    <span {...stylex.attrs(contextUsageStyles.tooltipHint)}>
                      接近上限时将自动省略较早消息
                    </span>
                  </div>
                </Show>
              </div>
            </div>
            <Show when={modelChoices().length > 0 || activeModelReasoning()?.effort}>
              <DropdownMenu
                items={modelAndReasoningMenu()}
                side="top"
                align="start"
                triggerAsChild={true}
                triggerTitle="选择模型和推理等级"
                triggerAriaLabel="选择模型和推理等级"
              >
                {(trigger) => (
                  <ComposerChip
                    trigger={trigger}
                    label={`${activeModelLabel()}${activeModelReasoning()?.effort ? ` · ${activeReasoning() ? REASONING_LABELS[activeReasoning()!] : "默认"}` : ""}`}
                    icon={<Cpu size={12} />}
                  />
                )}
              </DropdownMenu>
            </Show>
          </div>
          <div {...stylex.attrs(composerStyles.composerRunActions)}>
            <Show
              when={!props.session.isLoading()}
              fallback={
                <IconButton
                  size="md"
                  variant="secondary"
                  xstyle={composerStyles.composerStopButton}
                  aria-label="停止生成"
                  title="停止生成并取消已排队消息"
                  onClick={() => props.session.stop()}
                >
                  <Square size={14} />
                </IconButton>
              }
            >
              <IconButton
                size="md"
                variant="primary"
                xstyle={composerStyles.composerSendButton}
                aria-label="发送"
                title="发送"
                disabled={!draft().trim() && attachments().length === 0}
                onClick={() => void send()}
              >
                <Send size={16} />
              </IconButton>
            </Show>
          </div>
        </div>
      </div>
    </div>
  )
}
