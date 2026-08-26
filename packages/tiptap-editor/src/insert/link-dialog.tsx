import * as stylex from "@stylexjs/stylex"
import type { Accessor } from "solid-js"
import { createSignal, Show } from "solid-js"

import type { Editor } from "@tiptap/core"
import { Dialog } from "@tabora/ui"
import { Input } from "@tabora/ui/input"

import { insertDialogStyles } from "./insert-dialog-styles"
import { insertLink } from "./link-content"

export function LinkInsertDialog(props: { editor: Accessor<Editor | null>; onClose: () => void }) {
  const [label, setLabel] = createSignal("链接备忘录")
  const [url, setUrl] = createSignal("")
  const [error, setError] = createSignal<string>()

  const applyLink = () => {
    const editor = props.editor()
    const href = url().trim()
    if (!editor || !href) {
      setError("请输入链接地址。")
      return
    }
    try {
      const parsedUrl = new URL(href)
      if (!insertLink(editor, label().trim() || parsedUrl.hostname, parsedUrl.toString())) {
        setError("当前编辑器无法插入链接，请重试。")
        return
      }
      props.onClose()
    } catch {
      setError("请输入有效的链接地址。")
    }
  }

  return (
    <Dialog
      open
      onCancel={props.onClose}
      onOk={applyLink}
      okText="插入"
      title="链接备忘录"
      description="插入可点击的链接文本。"
    >
      <div {...stylex.attrs(insertDialogStyles.body)}>
        <Input
          size="sm"
          aria-label="链接文本"
          value={label()}
          onInput={(value) => setLabel(value as string)}
        />
        <Input
          size="sm"
          aria-label="链接地址"
          placeholder="https://example.com"
          value={url()}
          onInput={(value) => setUrl(value as string)}
        />
        <Show when={error()}>
          <span {...stylex.attrs(insertDialogStyles.error)}>{error()}</span>
        </Show>
      </div>
    </Dialog>
  )
}
