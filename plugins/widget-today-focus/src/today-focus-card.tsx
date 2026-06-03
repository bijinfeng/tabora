import { createSignal, onMount } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Checkbox, Field, Input } from "@tabora/ui"

function getLegacyStorage(): Storage | null {
  const storage = typeof window !== "undefined" ? window.localStorage : undefined
  if (
    storage &&
    typeof storage.getItem === "function" &&
    typeof storage.removeItem === "function"
  ) {
    return storage
  }
  return null
}

function migrateFromLocalStorage(key: string): string | null {
  const storage = getLegacyStorage()
  if (!storage) return null
  const value = storage.getItem(key)
  if (value !== null) storage.removeItem(key)
  return value
}

export function TodayFocusCard(props: WidgetViewProps) {
  const [focus, setFocus] = createSignal("")
  const [done, setDone] = createSignal(false)
  const contentKey = "focus-content"
  const doneKey = "focus-done"
  const inputId = () => `today-focus-${props.instanceId}`

  onMount(async () => {
    let saved = await props.data.get<string>(contentKey)
    let savedDone = await props.data.get<string>(doneKey)
    if (saved === undefined) {
      const legacy = migrateFromLocalStorage(`today-focus:${props.instanceId}:content`)
      const legacyDone = migrateFromLocalStorage(`today-focus:${props.instanceId}:done`)
      if (legacy !== null) {
        saved = legacy
        await props.data.save(contentKey, legacy)
      }
      if (legacyDone !== null) {
        savedDone = legacyDone
        await props.data.save(doneKey, legacyDone)
      }
    }
    if (saved) setFocus(saved)
    setDone(savedDone === "true")
  })

  return (
    <div class="today-focus-widget">
      <Field label="今天最重要的一件事" htmlFor={inputId()}>
        <Input
          id={inputId()}
          value={focus()}
          onInput={async (v) => {
            setFocus(v)
            await props.data.save(contentKey, v)
          }}
          placeholder="写下今日重点"
          aria-label="今日重点内容"
        />
      </Field>
      <Checkbox
        checked={done()}
        onChange={async (v) => {
          setDone(v)
          await props.data.save(doneKey, String(v))
        }}
        aria-label="今日重点完成状态"
        label={done() ? "已完成" : "尚未完成"}
      />
    </div>
  )
}
