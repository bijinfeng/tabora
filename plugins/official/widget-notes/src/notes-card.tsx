import { createSignal, onMount } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Textarea } from "@tabora/ui"

export function NotesCard(props: WidgetViewProps) {
  const [text, setText] = createSignal("")
  const storageKey = "notes-content"

  onMount(async () => {
    const saved = await props.data.get<string>(storageKey)
    if (saved) setText(saved)
  })

  return (
    <div class="notes-widget">
      <textarea
        class="notes-area"
        value={text()}
        onInput={async (event) => {
          const value = event.currentTarget.value
          setText(value)
          await props.data.save(storageKey, value)
        }}
        placeholder="写点什么..."
        aria-label="便签内容"
        rows={4}
      />
      <div class="notes-footer">自动保存</div>
    </div>
  )
}

export function NotesModal(props: WidgetViewProps) {
  const [text, setText] = createSignal("")
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
        aria-label="便签弹窗内容"
        rows={12}
      />
    </div>
  )
}
