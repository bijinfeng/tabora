import { createSignal, onMount } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Textarea } from "@tabora/ui"

const defaultNoteText = "MVP 重点：布局本身也是插件。平台只提供运行时、权限桥、持久化与安全回退。"

export function NotesCard(props: WidgetViewProps) {
  const [text, setText] = createSignal(defaultNoteText)
  const storageKey = "notes-content"

  onMount(async () => {
    const saved = await props.data.get<string>(storageKey)
    if (saved) setText(saved)
  })

  return (
    <div class="notes-widget">
      <Textarea
        value={text()}
        onInput={(value) => {
          setText(value)
          void props.data.save(storageKey, value)
        }}
        placeholder="快速记录想法..."
        aria-label="便签内容"
        rows={4}
      />
      <div class="notes-footer">自动保存</div>
    </div>
  )
}

export function NotesExpand(props: WidgetViewProps) {
  const [text, setText] = createSignal(defaultNoteText)
  const storageKey = "notes-content"

  onMount(async () => {
    const saved = await props.data.get<string>(storageKey)
    if (saved) setText(saved)
  })

  return (
    <div class="notes-modal">
      <h3>便签</h3>
      <Textarea
        value={text()}
        onInput={async (v) => {
          setText(v)
          await props.data.save(storageKey, v)
        }}
        placeholder="尽情书写..."
        aria-label="便签展开内容"
        rows={12}
      />
    </div>
  )
}
