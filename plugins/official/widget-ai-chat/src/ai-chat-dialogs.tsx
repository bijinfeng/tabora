import * as stylex from "@stylexjs/stylex"
import { For, Show } from "solid-js"
import type { Accessor, Setter } from "solid-js"
import { Button, IconButton } from "@tabora/ui/button"
import { Dialog } from "@tabora/ui/dialog"
import { Input } from "@tabora/ui/input"
import { Textarea } from "@tabora/ui/textarea"
import X from "lucide-solid/icons/x"
import type { AiChatContextBlock, AiChatConversationMeta, AiChatSession } from "./ai-chat-session"
import { styles } from "./styles"

/** Conversation mutations and option dialogs, kept outside the chat surface composition. */
export function AiChatDialogs(props: {
  session: AiChatSession
  renaming: Accessor<AiChatConversationMeta | null>
  setRenaming: Setter<AiChatConversationMeta | null>
  renameDraft: Accessor<string>
  setRenameDraft: Setter<string>
  clearing: Accessor<AiChatConversationMeta | null>
  setClearing: Setter<AiChatConversationMeta | null>
  deleting: Accessor<AiChatConversationMeta | null>
  setDeleting: Setter<AiChatConversationMeta | null>
  contextEditor: Accessor<boolean>
  setContextEditor: Setter<boolean>
  contextLabel: Accessor<string>
  setContextLabel: Setter<string>
  contextText: Accessor<string>
  setContextText: Setter<string>
  contextBlocks: Accessor<AiChatContextBlock[]>
  onAddContext: () => void
  onRemoveContext: (id: string) => void
  optionsFor: Accessor<AiChatConversationMeta | null>
  setOptionsFor: Setter<AiChatConversationMeta | null>
  promptDraft: Accessor<string>
  setPromptDraft: Setter<string>
  temperatureDraft: Accessor<string>
  setTemperatureDraft: Setter<string>
  temperatureInvalid: Accessor<boolean>
  setTemperatureInvalid: Setter<boolean>
  maxOutputTokensDraft: Accessor<string>
  setMaxOutputTokensDraft: Setter<string>
  maxOutputTokensInvalid: Accessor<boolean>
  setMaxOutputTokensInvalid: Setter<boolean>
  onSaveOptions: () => void
}) {
  const closeContextEditor = () => {
    props.setContextEditor(false)
    props.setContextLabel("")
    props.setContextText("")
  }

  return (
    <>
      <Show when={props.renaming()}>
        {(conversation) => (
          <Dialog
            open
            title="重命名对话"
            onCancel={() => props.setRenaming(null)}
            onOk={() => {
              props.session.renameConversation(conversation().id, props.renameDraft())
              props.setRenaming(null)
            }}
            okText="保存"
          >
            <Input
              value={props.renameDraft()}
              onInput={props.setRenameDraft}
              aria-label="对话名称"
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.isComposing) {
                  props.session.renameConversation(conversation().id, props.renameDraft())
                  props.setRenaming(null)
                }
              }}
            />
          </Dialog>
        )}
      </Show>
      <Show when={props.clearing()}>
        {(conversation) => (
          <Dialog
            open
            title="清空对话消息"
            description={`将清空「${conversation().title}」中的 ${conversation().messageCount} 条消息，但保留会话和运行参数。`}
            onCancel={() => props.setClearing(null)}
            footer={
              <>
                <Button variant="secondary" size="sm" onClick={() => props.setClearing(null)}>
                  取消
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    if (conversation().id !== props.session.activeId())
                      props.session.switchConversation(conversation().id)
                    props.session.clear()
                    props.setClearing(null)
                  }}
                >
                  清空消息
                </Button>
              </>
            }
          />
        )}
      </Show>
      <Show when={props.deleting()}>
        {(conversation) => (
          <Dialog
            open
            destructive
            title="删除对话"
            description={`将删除「${conversation().title}」及其 ${conversation().messageCount} 条消息，此操作无法恢复。`}
            onCancel={() => props.setDeleting(null)}
            footer={
              <>
                <Button variant="secondary" size="sm" onClick={() => props.setDeleting(null)}>
                  取消
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => {
                    props.session.deleteConversation(conversation().id)
                    props.setDeleting(null)
                  }}
                >
                  删除
                </Button>
              </>
            }
          />
        )}
      </Show>
      <Show when={props.contextEditor()}>
        <Dialog
          open
          title="添加上下文"
          description="上下文会以片段形式追加到系统提示词末尾，仅作用于当前对话。"
          onCancel={closeContextEditor}
          onOk={() => {
            props.onAddContext()
            props.setContextEditor(false)
          }}
          okText="添加"
        >
          <div {...stylex.attrs(styles.optionsForm)}>
            <label {...stylex.attrs(styles.optionsLabel)}>
              <span {...stylex.attrs(styles.optionsLabelText)}>片段名称（可选）</span>
              <Input
                value={props.contextLabel()}
                onInput={props.setContextLabel}
                placeholder="例如：项目说明"
                aria-label="片段名称"
              />
            </label>
            <label {...stylex.attrs(styles.optionsLabel)}>
              <span {...stylex.attrs(styles.optionsLabelText)}>片段内容</span>
              <Textarea
                rows={6}
                value={props.contextText()}
                onInput={props.setContextText}
                placeholder="粘贴需要 AI 参考的资料、代码或说明"
                aria-label="片段内容"
              />
            </label>
            <Show when={props.contextBlocks().length > 0}>
              <div {...stylex.attrs(styles.contextList)}>
                <span {...stylex.attrs(styles.optionsLabelText)}>已添加的上下文</span>
                <For each={props.contextBlocks()}>
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
                        onClick={() => props.onRemoveContext(block.id)}
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
      <Show when={props.optionsFor()}>
        {(conversation) => (
          <Dialog
            open
            title={`对话设置 · ${conversation().title}`}
            description="仅作用于当前对话；留空时使用默认值。"
            onCancel={() => props.setOptionsFor(null)}
            onOk={props.onSaveOptions}
            okText="保存"
          >
            <div {...stylex.attrs(styles.optionsForm)}>
              <label {...stylex.attrs(styles.optionsLabel)}>
                <span {...stylex.attrs(styles.optionsLabelText)}>系统提示词</span>
                <Textarea
                  rows={4}
                  value={props.promptDraft()}
                  onInput={props.setPromptDraft}
                  placeholder="留空使用默认的工作台助手提示词"
                  aria-label="系统提示词"
                />
              </label>
              <label {...stylex.attrs(styles.optionsLabel)}>
                <span {...stylex.attrs(styles.optionsLabelText)}>温度（0–2，留空使用默认）</span>
                <Input
                  value={props.temperatureDraft()}
                  onInput={(value) => {
                    props.setTemperatureDraft(value)
                    props.setTemperatureInvalid(false)
                  }}
                  invalid={props.temperatureInvalid()}
                  aria-label="温度"
                  placeholder="例如 0.7"
                />
                <Show when={props.temperatureInvalid()}>
                  <span {...stylex.attrs(styles.optionsHint)}>温度需为 0 到 2 之间的数字</span>
                </Show>
              </label>
              <label {...stylex.attrs(styles.optionsLabel)}>
                <span {...stylex.attrs(styles.optionsLabelText)}>
                  最大输出 Token（1–8192，留空使用默认）
                </span>
                <Input
                  value={props.maxOutputTokensDraft()}
                  onInput={(value) => {
                    props.setMaxOutputTokensDraft(value)
                    props.setMaxOutputTokensInvalid(false)
                  }}
                  invalid={props.maxOutputTokensInvalid()}
                  aria-label="最大输出 Token"
                  placeholder="例如 2048"
                />
                <Show when={props.maxOutputTokensInvalid()}>
                  <span {...stylex.attrs(styles.optionsHint)}>
                    最大输出 Token 需为 1 到 8192 之间的整数
                  </span>
                </Show>
              </label>
            </div>
          </Dialog>
        )}
      </Show>
    </>
  )
}
