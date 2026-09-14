import * as stylex from "@stylexjs/stylex"
import { createEffect, createSignal, Show } from "solid-js"
import { onCleanup, onMount } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api/sdk"
import type { UIMessage } from "@tanstack/ai-client"
import { Button, IconButton } from "@tabora/ui/button"
import { Drawer } from "@tabora/ui/drawer"
import { EmptyState } from "@tabora/ui/empty-state"
import { InlineError } from "@tabora/ui/inline-error"
import MessageSquare from "lucide-solid/icons/message-square"
import { ConversationList } from "../conversation-list/ai-chat-conversation-list"
import { AiChatDialogs } from "../dialogs/ai-chat-dialogs"
import { AiChatMessageThread } from "../message/ai-chat-message-thread"
import { AiChatComposer } from "../composer/ai-chat-composer"
import type { AiChatComposerController } from "../composer/ai-chat-composer"
import {
  aiChatErrorCopy,
  getAiChatSession,
  getAiChatSettingsOpener,
  messageText,
  registerAiChatView,
} from "../conversation/ai-chat-session"
import type { AiChatContextBlock, AiChatConversationMeta } from "../conversation/ai-chat-session"
import { layoutStyles } from "./ai-chat-layout.styles"

function newContextId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `ctx-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

/** Composes conversation navigation, thread feedback and modal editing surfaces. */
export function AiChatExpand(props: WidgetViewProps) {
  const session = getAiChatSession({ instanceId: props.instanceId, data: props.data })
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
  const [contextEditor, setContextEditor] = createSignal(false)
  const [contextLabel, setContextLabel] = createSignal("")
  const [contextText, setContextText] = createSignal("")
  const [copiedMessageId, setCopiedMessageId] = createSignal<string | null>(null)
  const [elapsed, setElapsed] = createSignal(0)
  let composer: AiChatComposerController | undefined
  let threadRef: HTMLDivElement | undefined
  let nearBottom = true

  const activeConversation = () =>
    session.conversations().find((conversation) => conversation.id === session.activeId())
  const contextBlocks = (): AiChatContextBlock[] => activeConversation()?.contextBlocks ?? []
  const updateActiveOptions = (
    partial: Parameters<typeof session.updateConversationOptions>[1],
  ) => {
    const id = session.activeId()
    if (id) session.updateConversationOptions(id, partial)
  }
  const addContextBlock = () => {
    const text = contextText().trim()
    if (!text) return
    const label = contextLabel().trim() || `上下文 ${contextBlocks().length + 1}`
    updateActiveOptions({
      contextBlocks: [...contextBlocks(), { id: newContextId(), label, text }],
    })
    setContextLabel("")
    setContextText("")
  }
  const removeContextBlock = (id: string) =>
    updateActiveOptions({ contextBlocks: contextBlocks().filter((block) => block.id !== id) })
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
  const copyAssistantMessage = async (message: UIMessage) => {
    const text = messageText(message).trim()
    if (!text || typeof navigator === "undefined" || !navigator.clipboard?.writeText) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageId(message.id)
      window.setTimeout(
        () => setCopiedMessageId((current) => (current === message.id ? null : current)),
        1600,
      )
    } catch {
      // Clipboard permission can be denied without changing the conversation.
    }
  }
  const startEditingLastUserMessage = () => {
    const message = [...session.messages()].reverse().find((candidate) => candidate.role === "user")
    if (message) composer?.editLastUserMessage(messageText(message))
  }
  const attachThread = (element: HTMLDivElement) => {
    threadRef = element
  }
  const trackScroll = () => {
    if (!threadRef) return
    nearBottom = threadRef.scrollHeight - threadRef.scrollTop - threadRef.clientHeight < 48
  }

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
    const timer = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000)
    onCleanup(() => clearInterval(timer))
  })
  createEffect(() => {
    void session.messages().length
    void session.isLoading()
    if (threadRef && nearBottom) threadRef.scrollTop = threadRef.scrollHeight
  })

  const errorCopy = () => aiChatErrorCopy(session.error())
  const openSettings = getAiChatSettingsOpener()
  const activeTitle = () => activeConversation()?.title ?? "新对话"
  const composerView = () => (
    <AiChatComposer
      session={session}
      {...(props.host.getAiSettings
        ? { getAiSettings: props.host.getAiSettings.bind(props.host) }
        : {})}
      onClear={(conversation) => {
        setClearing(conversation)
      }}
      onOpenContextEditor={() => {
        setContextEditor(true)
      }}
      onController={(controller) => {
        composer = controller
      }}
    />
  )
  return (
    <div
      {...stylex.attrs(layoutStyles.expandRoot)}
      onKeyDown={(event) => {
        if (
          (event.ctrlKey || event.metaKey) &&
          event.key.toLowerCase() === "n" &&
          !event.isComposing
        ) {
          event.preventDefault()
          session.startNewConversation()
        }
      }}
    >
      <div {...stylex.attrs(layoutStyles.expandHeader)}>
        <IconButton
          size="sm"
          variant="ghost"
          xstyle={layoutStyles.historyToggle}
          aria-label="会话列表"
          onClick={() => setDrawerOpen(true)}
        >
          <MessageSquare size={14} />
        </IconButton>
        <span {...stylex.attrs(layoutStyles.activeTitle)}>
          {session.activeId() ? activeTitle() : "AI 对话"}
        </span>
      </div>
      <div {...stylex.attrs(layoutStyles.expandBody)}>
        <aside {...stylex.attrs(layoutStyles.side)}>
          <ConversationList
            session={session}
            onNew={() => session.startNewConversation()}
            onRename={setRenaming}
            onClear={setClearing}
            onDelete={setDeleting}
            onOptions={openConversationOptions}
          />
        </aside>
        <Show
          when={session.activeId()}
          fallback={
            <div {...stylex.attrs(layoutStyles.empty)}>
              <div {...stylex.attrs(layoutStyles.emptyWelcome)}>
                <div {...stylex.attrs(layoutStyles.emptyWelcomeContent)}>
                  <EmptyState
                    title="接下来，交给我吧"
                    titleClass={stylex.attrs(layoutStyles.emptyTitle).class}
                  />
                  <div {...stylex.attrs(layoutStyles.emptyComposer)}>{composerView()}</div>
                </div>
              </div>
            </div>
          }
        >
          <div {...stylex.attrs(layoutStyles.main)}>
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
              <div {...stylex.attrs(layoutStyles.statusBar)}>
                <InlineError>
                  {errorCopy().title}：{errorCopy().hint}
                </InlineError>
                <Show when={!session.isLoading()}>
                  <div {...stylex.attrs(layoutStyles.statusActions)}>
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
            {composerView()}
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
            session.startNewConversation()
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
