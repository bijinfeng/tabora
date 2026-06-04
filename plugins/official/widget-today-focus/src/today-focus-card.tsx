import { createSignal, onMount } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"

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
      <input
        id={inputId()}
        class="focus-input"
        value={focus()}
        onInput={async (event) => {
          const value = event.currentTarget.value
          setFocus(value)
          await props.data.save(contentKey, value)
        }}
        placeholder="写下今日重点"
        aria-label="今日重点内容"
      />
      <label class="focus-check-row" for={`${inputId()}-done`}>
        <input
          id={`${inputId()}-done`}
          class="focus-check"
          type="checkbox"
          checked={done()}
          onChange={async (event) => {
            const value = event.currentTarget.checked
            setDone(value)
            await props.data.save(doneKey, String(value))
          }}
        />
        <span>{done() ? "已完成" : "尚未完成"}</span>
      </label>
    </div>
  )
}
