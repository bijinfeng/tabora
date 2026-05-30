import { createSignal, onMount } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Textarea } from "@tabora/ui"

function migrateFromLocalStorage(key: string): string | null {
  const value = localStorage.getItem(key)
  if (value !== null) localStorage.removeItem(key)
  return value
}

export function NotesCard(props: WidgetViewProps) {
  const [text, setText] = createSignal("")
  const storageKey = "notes-content"

  onMount(async () => {
    let saved = await props.data.get<string>(storageKey)
    if (saved === undefined) {
      const legacy = migrateFromLocalStorage("notes-content")
      if (legacy !== null) {
        saved = legacy
        await props.data.save(storageKey, legacy)
      }
    }
    if (saved) setText(saved)
  })

  return (
    <Textarea
      value={text()}
      onInput={async (v) => {
        setText(v)
        await props.data.save(storageKey, v)
      }}
      placeholder="写点什么..."
      aria-label="便签内容"
      rows={4}
    />
  )
}

export function NotesModal(props: WidgetViewProps) {
  const [text, setText] = createSignal("")
  const storageKey = "notes-content"

  onMount(async () => {
    let saved = await props.data.get<string>(storageKey)
    if (saved === undefined) {
      const legacy = migrateFromLocalStorage("notes-content")
      if (legacy !== null) {
        saved = legacy
        await props.data.save(storageKey, legacy)
      }
    }
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
