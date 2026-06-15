import { createSignal, onMount } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Checkbox, Input } from "@tabora/ui"

const defaultFocusText = "把默认新标签页做成可组合的个人工作入口"

export function TodayFocusCard(props: WidgetViewProps) {
  const [focus, setFocus] = createSignal(defaultFocusText)
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
      <Input
        id={inputId()}
        value={focus()}
        onInput={(value) => {
          setFocus(value)
          void props.data.save(contentKey, value)
        }}
        placeholder="今天最重要的一件事是什么？"
        aria-label="今日重点内容"
      />
      <Checkbox
        checked={done()}
        label={done() ? "已完成" : "尚未完成"}
        onChange={async (checked) => {
          setDone(checked)
          await props.data.save(doneKey, String(checked))
        }}
      />
    </div>
  )
}
