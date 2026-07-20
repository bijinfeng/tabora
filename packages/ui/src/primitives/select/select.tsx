import { Select as KSelect } from "@kobalte/core/select"
import type { SelectRootItemComponentProps } from "@kobalte/core/select"
import { For, Show, splitProps } from "solid-js"
import type { JSX } from "solid-js"
import { Check, ChevronDown, X } from "lucide-solid"

export type SelectOption<V extends string> = { value: V; label: string; disabled?: boolean }

type SelectPartStyleProps = {
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  valueClass?: string | undefined
  valueInvalidClass?: string | undefined
  valuePlaceholderClass?: string | undefined
  iconClass?: string | undefined
  tagsClass?: string | undefined
  tagClass?: string | undefined
  tagRemoveClass?: string | undefined
  tagMoreClass?: string | undefined
  placeholderClass?: string | undefined
  contentClass?: string | undefined
  contentStyle?: JSX.CSSProperties | undefined
  listboxClass?: string | undefined
  itemClass?: string | undefined
  itemSelectedClass?: string | undefined
  itemDisabledClass?: string | undefined
  itemCheckClass?: string | undefined
  itemLabelClass?: string | undefined
}

// Single-select props
export type SelectSingleProps<V extends string> = SelectPartStyleProps & {
  value: V
  onChange: (value: V) => void
  options: SelectOption<V>[]
  multiple?: false
  placeholder?: JSX.Element
  size?: "sm" | "md"
  disabled?: boolean
  invalid?: boolean
  "aria-label"?: string
  id?: string
}

// Multi-select props
export type SelectMultipleProps<V extends string> = SelectPartStyleProps & {
  value: V[]
  onChange: (value: V[]) => void
  options: SelectOption<V>[]
  multiple: true
  placeholder?: JSX.Element
  maxVisibleTags?: number
  size?: "sm" | "md"
  disabled?: boolean
  invalid?: boolean
  "aria-label"?: string
  id?: string
}

export type SelectProps<V extends string> = SelectSingleProps<V> | SelectMultipleProps<V>

function joinClasses(...classes: Array<string | undefined>) {
  return classes.filter(Boolean).join(" ") || undefined
}

function optionalPartProps(className: string | undefined, style: JSX.CSSProperties | undefined) {
  return {
    ...(className !== undefined ? { class: className } : {}),
    ...(style !== undefined ? { style } : {}),
  }
}

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
    "style",
    "valueClass",
    "valueInvalidClass",
    "valuePlaceholderClass",
    "iconClass",
    "tagsClass",
    "tagClass",
    "tagRemoveClass",
    "tagMoreClass",
    "placeholderClass",
    "contentClass",
    "contentStyle",
    "listboxClass",
    "itemClass",
    "itemSelectedClass",
    "itemDisabledClass",
    "itemCheckClass",
    "itemLabelClass",
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
    const isSelected = () =>
      isMultiple()
        ? selectedOptions().some((option) => option.value === p.item.rawValue.value)
        : selectedOption()?.value === p.item.rawValue.value

    return (
      <KSelect.Item
        item={p.item}
        class={joinClasses(
          local.itemClass,
          isSelected() ? local.itemSelectedClass : undefined,
          p.item.rawValue.disabled ? local.itemDisabledClass : undefined,
        )}
      >
        <span class={local.itemCheckClass} aria-hidden="true">
          <KSelect.ItemIndicator>
            <Check size={16} strokeWidth={2} />
          </KSelect.ItemIndicator>
        </span>
        <KSelect.ItemLabel class={local.itemLabelClass}>{p.item.rawValue.label}</KSelect.ItemLabel>
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
          class={local.class}
          style={local.style}
          data-size={local.size ?? "md"}
          data-multiple=""
          data-invalid={local.invalid ? "" : undefined}
          aria-invalid={local.invalid ? true : undefined}
          {...(local["aria-label"] !== undefined ? { "aria-label": local["aria-label"] } : {})}
          {...(local.id !== undefined ? { id: local.id } : {})}
        >
          <div class={local.tagsClass}>
            <Show when={visibleTags().length > 0}>
              <For each={visibleTags()}>
                {(opt) => (
                  <span class={local.tagClass}>
                    {opt.label}
                    <button
                      type="button"
                      class={local.tagRemoveClass}
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
                <span class={local.tagMoreClass}>+{remainingCount()}</span>
              </Show>
            </Show>
            <Show when={visibleTags().length === 0}>
              <span class={local.placeholderClass}>{local.placeholder ?? "选择..."}</span>
            </Show>
          </div>
          <KSelect.Icon class={local.iconClass} aria-hidden="true">
            <ChevronDown size={16} strokeWidth={2} />
          </KSelect.Icon>
        </KSelect.Trigger>
        <KSelect.Portal>
          <KSelect.Content {...optionalPartProps(local.contentClass, local.contentStyle)}>
            <KSelect.Listbox class={local.listboxClass} />
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
        class={local.class}
        style={local.style}
        data-size={local.size ?? "md"}
        data-invalid={local.invalid ? "" : undefined}
        aria-invalid={local.invalid ? true : undefined}
        {...(local["aria-label"] !== undefined ? { "aria-label": local["aria-label"] } : {})}
        {...(local.id !== undefined ? { id: local.id } : {})}
      >
        <span
          class={joinClasses(
            local.valueClass,
            local.invalid ? local.valueInvalidClass : undefined,
            !hasSelection() ? local.valuePlaceholderClass : undefined,
          )}
          data-placeholder-shown={!hasSelection() ? "" : undefined}
        >
          <KSelect.Value<SelectOption<V>>>
            {(state) => state.selectedOption()?.label ?? local.placeholder ?? ""}
          </KSelect.Value>
        </span>
        <KSelect.Icon class={local.iconClass} aria-hidden="true">
          <ChevronDown size={16} strokeWidth={2} />
        </KSelect.Icon>
      </KSelect.Trigger>
      <KSelect.Portal>
        <KSelect.Content {...optionalPartProps(local.contentClass, local.contentStyle)}>
          <KSelect.Listbox class={local.listboxClass} />
        </KSelect.Content>
      </KSelect.Portal>
    </KSelect>
  )
}
