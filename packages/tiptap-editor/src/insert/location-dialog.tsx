import * as stylex from "@stylexjs/stylex"
import type { Accessor } from "solid-js"
import { createSignal, Show } from "solid-js"

import type { Editor } from "@tiptap/core"
import { Dialog } from "@tabora/ui"

import { insertDialogStyles } from "./insert-dialog-styles"
import { insertCurrentLocation } from "./location-content"

export function LocationInsertDialog(props: {
  editor: Accessor<Editor | null>
  onClose: () => void
}) {
  const [error, setError] = createSignal<string>()

  const insertLocation = async () => {
    const editor = props.editor()
    if (!editor) return
    try {
      await insertCurrentLocation(editor)
      props.onClose()
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "未能获取当前位置。")
    }
  }

  return (
    <Dialog
      open
      onCancel={props.onClose}
      onOk={() => void insertLocation()}
      okText="获取当前位置"
      title="添加位置"
      description="获取当前位置后，插入一个 OpenStreetMap 链接。"
    >
      <Show when={error()}>
        <span {...stylex.attrs(insertDialogStyles.error)}>{error()}</span>
      </Show>
    </Dialog>
  )
}
