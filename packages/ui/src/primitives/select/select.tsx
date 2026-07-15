import { Select as KSelect } from "@kobalte/core/select"
import type { SelectRootItemComponentProps } from "@kobalte/core/select"
import { For, Show, splitProps } from "solid-js"
import type { JSX } from "solid-js"
import { Check, ChevronDown, X } from "lucide-solid"

export type SelectOption<V extends string> = { value: V; label: string; disabled?: boolean }

// Single-select props
export type SelectSingleProps<V extends string> = {
  value: V
  onChange: (value: V) => void
  options: SelectOption<V>[]
  multiple?: false
  placeholder?: JSX.Element
  size?: "sm" | "md"
  disabled?: boolean
  invalid?: boolean
  class?: string
  "aria-label"?: string
  id?: string
}

// Multi-select props
export type SelectMultipleProps<V extends string> = {
  value: V[]
  onChange: (value: V[]) => void
  options: SelectOption<V>[]
  multiple: true
  placeholder?: JSX.Element
  maxVisibleTags?: number
  size?: "sm" | "md"
  disabled?: boolean
  invalid?: boolean
  class?: string
  "aria-label"?: string
  id?: string
}

export type SelectProps<V extends string> = SelectSingleProps<V> | SelectMultipleProps<V>

export function Select<V extends string>(props: SelectProps<V>) {
  const [local] = splitProps(props, [
    "value",
    "options",
    "onChange",
    "placeholder",
    "multiple",
    "size",
    "disabled",
    "invalid",
    "aria-label",
    "id",
    "class",
  ])

  const isMultiple = () => local.multiple === true

  // Single-select helpers
  const selectedOption = () =>
    !isMultiple() && typeof local.value === "string"
      ? local.options.find((option) => option.value === local.value)
      : undefined

  // Multi-select helpers
  const selectedOptions = () =>
    isMultiple() && Array.isArray(local.value)
      ? local.options.filter((opt) => (local.value as V[]).includes(opt.value))
      : []

  const maxTags = () => (local as SelectMultipleProps<V>).maxVisibleTags ?? 99
  const visibleTags = () => selectedOptions().slice(0, maxTags())
  const remainingCount = () => Math.max(0, selectedOptions().length - maxTags())

  const hasSelection = () =>
    isMultiple() ? selectedOptions().length > 0 : selectedOption() !== undefined

  const removeTag = (valueToRemove: V) => {
    if (!isMultiple()) return
    const newValue = (local.value as V[]).filter((v) => v !== valueToRemove)
    ;(local.onChange as (value: V[]) => void)(newValue)
  }

  const itemComponent = (p: SelectRootItemComponentProps<SelectOption<V>>) => {
    return (
      <KSelect.Item item={p.item} class="tbr-select-item">
        <span class="tbr-select-item-check" aria-hidden="true">
          <KSelect.ItemIndicator>
            <Check size={16} strokeWidth={2} />
          </KSelect.ItemIndicator>
        </span>
        <KSelect.ItemLabel class="tbr-select-item-label">{p.item.rawValue.label}</KSelect.ItemLabel>
      </KSelect.Item>
    )
  }

  if (isMultiple()) {
    const handleMultipleChange = (newValue: SelectOption<V>[]) => {
      const values = newValue.map((o) => o.value)
      ;(local.onChange as (value: V[]) => void)(values)
    }

    return (
      <KSelect<SelectOption<V>>
        value={selectedOptions()}
        onChange={handleMultipleChange}
        options={local.options}
        optionValue="value"
        optionTextValue="label"
        optionDisabled="disabled"
        multiple
        disabled={local.disabled ?? false}
        itemComponent={itemComponent}
      >
        <KSelect.Trigger
          class={`tbr-select-trigger ${local.class ?? ""}`}
          data-size={local.size ?? "md"}
          data-multiple=""
          data-invalid={local.invalid ? "" : undefined}
          aria-invalid={local.invalid ? true : undefined}
          {...(local["aria-label"] !== undefined ? { "aria-label": local["aria-label"] } : {})}
          {...(local.id !== undefined ? { id: local.id } : {})}
        >
          <div class="tbr-select-tags">
            <Show when={visibleTags().length > 0}>
              <For each={visibleTags()}>
                {(opt) => (
                  <span class="tbr-select-tag">
                    {opt.label}
                    <button
                      type="button"
                      class="tbr-select-tag-remove"
                      onClick={(e) => {
                        e.stopPropagation()
                        removeTag(opt.value)
                      }}
                      aria-label={`移除 ${opt.label}`}
                      tabIndex={-1}
                    >
                      <X size={10} strokeWidth={2.5} />
                    </button>
                  </span>
                )}
              </For>
              <Show when={remainingCount() > 0}>
                <span class="tbr-select-tag-more">+{remainingCount()}</span>
              </Show>
            </Show>
            <Show when={visibleTags().length === 0}>
              <span class="tbr-select-placeholder">{local.placeholder ?? "选择..."}</span>
            </Show>
          </div>
          <KSelect.Icon class="tbr-select-icon" aria-hidden="true">
            <ChevronDown size={16} strokeWidth={2} />
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

  const handleSingleChange = (newValue: SelectOption<V> | null) => {
    if (newValue) {
      ;(local.onChange as (value: V) => void)(newValue.value)
    }
  }

  return (
    <KSelect<SelectOption<V>>
      value={selectedOption() ?? null}
      onChange={handleSingleChange}
      options={local.options}
      optionValue="value"
      optionTextValue="label"
      optionDisabled="disabled"
      disabled={local.disabled ?? false}
      itemComponent={itemComponent}
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
          <ChevronDown size={16} strokeWidth={2} />
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
