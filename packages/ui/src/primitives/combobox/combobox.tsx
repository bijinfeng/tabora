import { For, createSignal } from "solid-js"

export type ComboboxOption<V extends string> = { value: V; label: string }

export type ComboboxProps<V extends string> = {
  value: string
  options: ComboboxOption<V>[]
  onInput: (value: string) => void
  onSelect: (value: V) => void
  placeholder?: string
  class?: string
}

export function Combobox<V extends string>(props: ComboboxProps<V>) {
  const [open, setOpen] = createSignal(false)
  const filtered = () =>
    props.options.filter((o) => o.label.toLowerCase().includes(props.value.toLowerCase()))
  return (
    <div
      class="tbr-combo-wrap"
      onFocusIn={() => setOpen(true)}
      onFocusOut={() => setTimeout(() => setOpen(false), 150)}
    >
      <input
        class="tbr-combo-input"
        value={props.value}
        placeholder={props.placeholder}
        onInput={(e) => {
          props.onInput(e.currentTarget.value)
          setOpen(true)
        }}
      />
      {open() && filtered().length > 0 && (
        <div class="tbr-combo-dropdown">
          <For each={filtered()}>
            {(opt) => (
              <div
                class="tbr-combo-option"
                onClick={() => {
                  props.onSelect(opt.value)
                  setOpen(false)
                }}
              >
                {opt.label}
              </div>
            )}
          </For>
        </div>
      )}
      {open() && filtered().length === 0 && props.value && (
        <div class="tbr-combo-dropdown">
          <div class="tbr-combo-empty">无匹配结果</div>
        </div>
      )}
    </div>
  )
}
