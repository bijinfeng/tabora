import type { JSX } from "solid-js"
import { createSignal, For } from "solid-js"

export type TagInputProps = {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  disabled?: boolean
  class?: string
  id?: string
  "aria-label": string
}

export function TagInput(props: TagInputProps) {
  const [draft, setDraft] = createSignal("")

  const addTag = (raw: string) => {
    const next = raw.trim()
    if (!next || props.value.includes(next)) return
    props.onChange([...props.value, next])
    setDraft("")
  }

  const removeTag = (tag: string) => props.onChange(props.value.filter((item) => item !== tag))

  return (
    <div class={props.class} data-disabled={props.disabled ? "" : undefined}>
      <For each={props.value}>
        {(tag) => (
          <span class="tbr-tag-input-tag">
            {tag}
            <button
              type="button"
              class="tbr-tag-input-remove"
              aria-label={`移除 ${tag}`}
              disabled={props.disabled}
              onClick={() => removeTag(tag)}
            >
              x
            </button>
          </span>
        )}
      </For>
      <input
        id={props.id}
        class="tbr-tag-input-core"
        value={draft()}
        placeholder={props.placeholder}
        disabled={props.disabled}
        aria-label={props["aria-label"]}
        onInput={(event) => setDraft(event.currentTarget.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === ",") {
            event.preventDefault()
            addTag(draft())
          }
          if (event.key === "Backspace" && draft() === "" && props.value.length > 0) {
            props.onChange(props.value.slice(0, -1))
          }
        }}
        onBlur={() => addTag(draft())}
      />
    </div>
  )
}

export type TagInputElement = JSX.Element
