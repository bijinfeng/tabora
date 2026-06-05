import { createSignal, onMount } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"

export function TodayFocusCard(props: WidgetViewProps) {
  const [focus, setFocus] = createSignal("")
  const [done, setDone] = createSignal(false)
  const contentKey = "focus-content"
  const doneKey = "focus-done"
  const inputId = () => `today-focus-${props.instanceId}`

  onMount(async () => {
    const saved = await props.data.get<string>(contentKey)
    const savedDone = await props.data.get<string>(doneKey)
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
