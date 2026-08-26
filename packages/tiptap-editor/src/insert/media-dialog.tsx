import * as stylex from "@stylexjs/stylex"
import type { Accessor } from "solid-js"
import { createSignal, Show } from "solid-js"

import type { Editor } from "@tiptap/core"
import { Dialog } from "@tabora/ui"
import { Button } from "@tabora/ui/button"

import { insertMedia } from "./media-content"
import { insertDialogStyles } from "./insert-dialog-styles"

export function MediaInsertDialog(props: {
  editor: Accessor<Editor | null>
  onClose: () => void
  uploadImage?: ((file: File) => Promise<string>) | undefined
}) {
  const [error, setError] = createSignal<string>()

  const handleMedia = async (file: File) => {
    const editor = props.editor()
    if (!editor) return
    try {
      await insertMedia(editor, file, props.uploadImage)
      props.onClose()
    } catch {
      setError("无法插入图片，请重试。")
    }
  }

  return (
    <Dialog
      open
      onCancel={props.onClose}
      title="插入媒体"
      description="选择图片后直接嵌入编辑器内容。"
      footer={
        <Button variant="secondary" size="sm" onClick={props.onClose}>
          取消
        </Button>
      }
    >
      <div {...stylex.attrs(insertDialogStyles.body)}>
        <input
          type="file"
          accept="image/*"
          aria-label="选择图片"
          onChange={(event) =>
            event.currentTarget.files?.[0] && void handleMedia(event.currentTarget.files[0])
          }
        />
        <Show when={error()}>
          <span {...stylex.attrs(insertDialogStyles.error)}>{error()}</span>
        </Show>
      </div>
    </Dialog>
  )
}
