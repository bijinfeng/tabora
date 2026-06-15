import { Combobox as KCombobox } from "@kobalte/core/combobox"
import { splitProps } from "solid-js"

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

  const options = () => local.options.map((o) => ({ value: o.value, label: o.label, raw: o }))

  const inputProps = () => {
    const p: Record<string, unknown> = {
      class: "tbr-combo-input",
      autocomplete: "off",
    }
    if (local.id !== undefined) p.id = local.id
    if (local["aria-label"] !== undefined) p["aria-label"] = local["aria-label"]
    return p
  }

  const onChange = (option: unknown) => {
    if (option) {
      const raw = (option as { raw?: ComboboxOption<V> }).raw
      if (raw) local.onSelect(raw)
    }
  }

  return (
    <div class={`tbr-combo-wrap ${local.class ?? ""}`}>
      <KCombobox
        options={options()}
        optionValue={(o: unknown) => (o as { value: string }).value}
        optionLabel={(o: unknown) => (o as { label: string }).label}
        optionTextValue={(o: unknown) => (o as { label: string }).label}
        onInputChange={local.onInput}
        onChange={onChange}
        placeholder={local.placeholder}
        triggerMode="focus"
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        itemComponent={(itemProps: any) => (
          <KCombobox.Item item={itemProps.item} class="tbr-combo-option">
            <KCombobox.ItemLabel>{itemProps.item.rawValue.label}</KCombobox.ItemLabel>
          </KCombobox.Item>
        )}
      >
        <KCombobox.Input {...inputProps()} />
        <KCombobox.Portal>
          <KCombobox.Content class="tbr-combo-dropdown">
            <KCombobox.Listbox />
          </KCombobox.Content>
        </KCombobox.Portal>
      </KCombobox>
    </div>
  )
}
