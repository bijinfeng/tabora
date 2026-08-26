import * as stylex from "@stylexjs/stylex"
import type { Accessor } from "solid-js"
import { createSignal, Show } from "solid-js"

import type { Editor } from "@tiptap/core"
import { Dialog } from "@tabora/ui"
import { Button } from "@tabora/ui/button"

import { insertFile } from "./file-content"
import { insertDialogStyles } from "./insert-dialog-styles"

export function FileInsertDialog(props: { editor: Accessor<Editor | null>; onClose: () => void }) {
  const [error, setError] = createSignal<string>()

  const handleFile = async (file: File) => {
    const editor = props.editor()
    if (!editor) return
    try {
      await insertFile(editor, file)
      props.onClose()
    } catch {
      setError("无法插入文件；MVP 版本仅支持不超过 5 MB 的文件。")
    }
  }

  return (
    <Dialog
      open
      onCancel={props.onClose}
      title="插入文件"
      description="文件会嵌入当前编辑器内容，单个文件不超过 5 MB。"
      footer={
        <Button variant="secondary" size="sm" onClick={props.onClose}>
          取消
        </Button>
      }
    >
      <div {...stylex.attrs(insertDialogStyles.body)}>
        <input
          type="file"
          aria-label="选择文件"
          onChange={(event) =>
            event.currentTarget.files?.[0] && void handleFile(event.currentTarget.files[0])
          }
        />
        <Show when={error()}>
          <span {...stylex.attrs(insertDialogStyles.error)}>{error()}</span>
        </Show>
      </div>
    </Dialog>
  )
}
