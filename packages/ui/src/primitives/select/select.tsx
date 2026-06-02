import { Select as KSelect } from "@kobalte/core/select"
import { splitProps } from "solid-js"
import type { JSX } from "solid-js"

export type SelectOption<V extends string> = { value: V; label: string; disabled?: boolean }

export type SelectProps<V extends string> = {
  value: V
  options: SelectOption<V>[]
  onChange: (value: V) => void
  placeholder?: JSX.Element
  size?: "sm" | "md"
  disabled?: boolean
  invalid?: boolean
  class?: string
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
    "invalid",
    "aria-label",
    "id",
    "class",
  ])

  const selectedOption = () => local.options.find((option) => option.value === local.value)
  const hasSelection = () => selectedOption() !== undefined

  return (
    <KSelect<SelectOption<V>>
      value={selectedOption() ?? null}
      onChange={(opt) => opt && local.onChange(opt.value)}
      options={local.options}
      optionValue="value"
      optionTextValue="label"
      optionDisabled="disabled"
      {...(local.disabled !== undefined ? { disabled: local.disabled } : {})}
      {...(local.placeholder !== undefined ? { placeholder: local.placeholder } : {})}
      itemComponent={(p) => (
        <KSelect.Item item={p.item} class="tbr-select-item">
          <span class="tbr-select-item-check" aria-hidden="true">
            {p.item.rawValue.value === local.value ? "✓" : ""}
          </span>
          <KSelect.ItemLabel class="tbr-select-item-label">
            {p.item.rawValue.label}
          </KSelect.ItemLabel>
        </KSelect.Item>
      )}
    >
      <KSelect.Trigger
        class={`tbr-select-trigger ${local.class ?? ""}`}
        data-size={local.size ?? "md"}
        data-invalid={local.invalid ? "" : undefined}
        aria-invalid={local.invalid ? true : undefined}
        {...(local["aria-label"] !== undefined ? { "aria-label": local["aria-label"] } : {})}
        {...(local.id !== undefined ? { id: local.id } : {})}
      >
        <span class="tbr-select-value" data-placeholder-shown={!hasSelection() ? "" : undefined}>
          <KSelect.Value<SelectOption<V>>>
            {(state) => state.selectedOption()?.label ?? local.placeholder ?? ""}
          </KSelect.Value>
        </span>
        <KSelect.Icon class="tbr-select-icon" aria-hidden="true">
          <span class="tbr-select-chevron">▼</span>
        </KSelect.Icon>
      </KSelect.Trigger>
      <KSelect.Portal>
        <KSelect.Content class="tbr-select-content">
          <KSelect.Listbox class="tbr-select-listbox" />
        </KSelect.Content>
      </KSelect.Portal>
    </KSelect>
  )
}
