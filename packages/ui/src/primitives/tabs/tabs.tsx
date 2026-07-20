import { Tabs as KTabs } from "@kobalte/core/tabs"
import type { JSX } from "solid-js"
import { For } from "solid-js"

export type TabsProps = {
  value: string
  onChange: (value: string) => void
  tabs: { value: string; label: JSX.Element; content: JSX.Element; disabled?: boolean }[]
  variant?: "underline" | "pills"
  size?: "sm" | "md"
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  listClass?: string | undefined
  listStyle?: JSX.CSSProperties | undefined
  triggerClass?: string | undefined
  triggerStyle?: JSX.CSSProperties | undefined
  triggerSelectedClass?: string | undefined
  triggerSelectedStyle?: JSX.CSSProperties | undefined
  indicatorClass?: string | undefined
  indicatorStyle?: JSX.CSSProperties | undefined
  contentClass?: string | undefined
  contentStyle?: JSX.CSSProperties | undefined
  "aria-label": string
}

function optionalPartProps(className: string | undefined, style: JSX.CSSProperties | undefined) {
  return {
    ...(className !== undefined ? { class: className } : {}),
    ...(style !== undefined ? { style } : {}),
  }
}

export function Tabs(props: TabsProps) {
  return (
    <KTabs
      class={props.class}
      style={props.style}
      data-variant={props.variant ?? "underline"}
      data-size={props.size ?? "md"}
      value={props.value}
      onChange={(v) => props.onChange(v)}
    >
      <KTabs.List class={props.listClass} style={props.listStyle} aria-label={props["aria-label"]}>
        <For each={props.tabs}>
          {(tab) => (
            <KTabs.Trigger
              class={[
                props.triggerClass,
                tab.value === props.value ? props.triggerSelectedClass : undefined,
              ]
                .filter(Boolean)
                .join(" ")}
              style={
                tab.value === props.value
                  ? { ...props.triggerStyle, ...props.triggerSelectedStyle }
                  : props.triggerStyle
              }
              value={tab.value}
              {...(tab.disabled ? { disabled: true } : {})}
            >
              {tab.label}
            </KTabs.Trigger>
          )}
        </For>
        <KTabs.Indicator {...optionalPartProps(props.indicatorClass, props.indicatorStyle)} />
      </KTabs.List>
      <For each={props.tabs}>
        {(tab) => (
          <KTabs.Content class={props.contentClass} style={props.contentStyle} value={tab.value}>
            {tab.content}
          </KTabs.Content>
        )}
      </For>
    </KTabs>
  )
}
