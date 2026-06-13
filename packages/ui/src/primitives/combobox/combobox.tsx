import { For, createSignal, createUniqueId, splitProps } from "solid-js"

export type ComboboxOption<V extends string> = { value: V; label: string }

export type ComboboxProps<V extends string> = {
  value: string
  options: ComboboxOption<V>[]
  onInput: (value: string) => void
  onSelect: (option: ComboboxOption<V>) => void
  placeholder?: string
  class?: string
  "aria-label"?: string
  id?: string
}

export function Combobox<V extends string>(props: ComboboxProps<V>) {
  const [local] = splitProps(props, [
    "value",
    "options",
    "onInput",
    "onSelect",
    "placeholder",
    "class",
    "aria-label",
    "id",
  ])
  const [open, setOpen] = createSignal(false)
  const listboxId = local.id ? `${local.id}-listbox` : createUniqueId()
  const filtered = () =>
    local.options.filter((o) => o.label.toLowerCase().includes(local.value.toLowerCase()))
  return (
    <div
      class={`tbr-combo-wrap ${local.class ?? ""}`}
      onFocusIn={() => setOpen(true)}
      onFocusOut={() => setTimeout(() => setOpen(false), 150)}
    >
      <input
        class="tbr-combo-input"
        id={local.id}
        value={local.value}
        placeholder={local.placeholder}
        role="combobox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-expanded={open()}
        aria-label={local["aria-label"]}
        autocomplete="off"
        onInput={(e) => {
          local.onInput(e.currentTarget.value)
          setOpen(true)
        }}
      />
      {open() && filtered().length > 0 && (
        <div class="tbr-combo-dropdown" id={listboxId} role="listbox">
          <For each={filtered()}>
            {(opt) => (
              <div
                class="tbr-combo-option"
                role="option"
                onClick={() => {
                  local.onSelect(opt)
                  setOpen(false)
                }}
              >
                {opt.label}
              </div>
            )}
          </For>
        </div>
      )}
      {open() && filtered().length === 0 && local.value && (
        <div class="tbr-combo-dropdown" id={listboxId} role="listbox">
          <div class="tbr-combo-empty">无匹配结果</div>
        </div>
      )}
    </div>
  )
}
