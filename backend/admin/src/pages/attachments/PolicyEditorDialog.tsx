import * as stylex from "@stylexjs/stylex"
import { Dialog, TagInput } from "@tabora/ui"
import { Button } from "@tabora/ui/button"
import { Field } from "@tabora/ui/field"
import { InlineError } from "@tabora/ui/inline-error"
import { Input } from "@tabora/ui/input"
import { createSignal, Show } from "solid-js"

import { upsertPolicy, type AttachmentPolicy } from "./attachmentsApi"
import { styles } from "./attachments.styles"

type Props = {
  open: boolean
  editing: AttachmentPolicy | null
  onClose: () => void
  onSaved: () => void
}

export function PolicyEditorDialog(props: Props) {
  const [entityType, setEntityType] = createSignal("")
  const [mimes, setMimes] = createSignal<string[]>([])
  const [maxSize, setMaxSize] = createSignal("")
  const [error, setError] = createSignal<string | null>(null)
  const [submitting, setSubmitting] = createSignal(false)
  let lastOpen = false

  // 打开时用 editing 初始化表单（新建则清空）
  const sync = () => {
    if (props.open && !lastOpen) {
      const e = props.editing
      setEntityType(e?.entityType ?? "")
      setMimes(e?.mimeWhitelist ?? [])
      setMaxSize(e?.maxSizeBytes != null ? String(e.maxSizeBytes) : "")
      setError(null)
    }
    lastOpen = props.open
    return null
  }

  async function handleSave() {
    if (submitting()) return
    if (!entityType().trim()) {
      setError("请输入 entity_type")
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      await upsertPolicy({
        entityType: entityType().trim(),
        mimeWhitelist: mimes().length > 0 ? mimes() : null,
        maxSizeBytes: maxSize().trim() ? Number(maxSize()) : null,
      })
      props.onSaved()
      props.onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {sync()}
      <Dialog
        open={props.open}
        onClose={props.onClose}
        title={props.editing ? "编辑附件策略" : "新建附件策略"}
        description="按 entity_type 限制可上传的 MIME 类型与文件大小。"
        footer={
          <div {...stylex.attrs(styles.footerRow)}>
            <Button variant="secondary" onClick={props.onClose}>
              取消
            </Button>
            <Button variant="primary" loading={submitting()} onClick={handleSave}>
              保存
            </Button>
          </div>
        }
      >
        <div {...stylex.attrs(styles.formGrid)}>
          <Field label="entity_type" htmlFor="policy-entity">
            <Input
              id="policy-entity"
              value={entityType()}
              onInput={setEntityType}
              placeholder="例如 note、avatar"
              disabled={props.editing !== null}
            />
          </Field>
          <Field label="MIME 白名单" helper="留空表示不限制类型">
            <TagInput
              value={mimes()}
              onChange={setMimes}
              placeholder="输入后回车，如 image/png"
              aria-label="MIME 白名单"
            />
          </Field>
          <Field label="最大字节数" htmlFor="policy-size" helper="留空表示不限制大小">
            <Input
              id="policy-size"
              type="text"
              value={maxSize()}
              onInput={setMaxSize}
              placeholder="例如 5242880（5MB）"
            />
          </Field>
          <Show when={error()}>
            <InlineError>{error()}</InlineError>
          </Show>
        </div>
      </Dialog>
    </>
  )
}
