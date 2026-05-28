import { Select as KSelect } from "@kobalte/core/select"
import { splitProps } from "solid-js"
import type { JSX } from "solid-js"

export type SelectOption<V extends string> = {
  value: V
  label: string
  disabled?: boolean
}

export type SelectProps<V extends string> = {
  value: V
  options: SelectOption<V>[]
  onChange: (value: V) => void
  placeholder?: JSX.Element
  size?: "sm" | "md"
  disabled?: boolean
  "aria-label"?: string
  id?: string
}

export function Select<V extends string>(props: SelectProps<V>) {
  const [local] = splitProps(props, [
    "value",
    "options",
    "onChange",
    "placeholder",
    "size",
    "disabled",
    "aria-label",
    "id",
  ])

  return (
    <KSelect<SelectOption<V>>
      value={local.options.find((o) => o.value === local.value) ?? null}
      onChange={(opt) => opt && local.onChange(opt.value)}
      options={local.options}
      optionValue="value"
      optionTextValue="label"
      optionDisabled="disabled"
      {...(local.disabled !== undefined ? { disabled: local.disabled } : {})}
      {...(local.placeholder !== undefined ? { placeholder: local.placeholder } : {})}
      itemComponent={(p) => (
        <KSelect.Item item={p.item} class="tabora-select-item">
          <KSelect.ItemLabel>{p.item.rawValue.label}</KSelect.ItemLabel>
        </KSelect.Item>
      )}
    >
      <KSelect.Trigger
        class="tabora-select-trigger"
        data-size={local.size ?? "md"}
        {...(local["aria-label"] !== undefined ? { "aria-label": local["aria-label"] } : {})}
        {...(local.id !== undefined ? { id: local.id } : {})}
      >
        <KSelect.Value<SelectOption<V>>>{(state) => state.selectedOption().label}</KSelect.Value>
        <KSelect.Icon class="tabora-select-icon" aria-hidden="true">
          ▾
        </KSelect.Icon>
      </KSelect.Trigger>
      <KSelect.Portal>
        <KSelect.Content class="tabora-select-content">
          <KSelect.Listbox class="tabora-select-listbox" />
        </KSelect.Content>
      </KSelect.Portal>
    </KSelect>
  )
}
