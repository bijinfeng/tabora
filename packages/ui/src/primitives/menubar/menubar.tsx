import { ToggleGroup as KToggleGroup } from "@kobalte/core/toggle-group"
import type { JSX } from "solid-js"
import { For } from "solid-js"

export type MenubarItem = {
  value: string
  label: JSX.Element
  disabled?: boolean
}

export type MenubarProps = {
  value: string
  onChange: (value: string) => void
  items: MenubarItem[]
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  itemClass?: string | undefined
  itemStyle?: JSX.CSSProperties | undefined
  itemPressedClass?: string | undefined
  itemPressedStyle?: JSX.CSSProperties | undefined
  "aria-label": string
}

export function Menubar(props: MenubarProps) {
  return (
    <KToggleGroup
      class={props.class}
      style={props.style}
      aria-label={props["aria-label"]}
      value={props.value}
      onChange={(value) => value && props.onChange(value)}
    >
      <For each={props.items}>
        {(item) => (
          <KToggleGroup.Item
            class={[
              props.itemClass,
              item.value === props.value ? props.itemPressedClass : undefined,
            ]
              .filter(Boolean)
              .join(" ")}
            style={
              item.value === props.value
                ? { ...props.itemStyle, ...props.itemPressedStyle }
                : props.itemStyle
            }
            value={item.value}
            {...(item.disabled !== undefined ? { disabled: item.disabled } : {})}
          >
            {item.label}
          </KToggleGroup.Item>
        )}
      </For>
    </KToggleGroup>
  )
}
