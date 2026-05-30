import { Tabs as KTabs } from "@kobalte/core/tabs"
import type { JSX } from "solid-js"
import { For } from "solid-js"

export type TabsProps = {
  value: string
  onChange: (value: string) => void
  tabs: { value: string; label: JSX.Element; content: JSX.Element }[]
  variant?: "underline" | "pills"
  size?: "sm" | "md"
  class?: string
  "aria-label": string
}

export function Tabs(props: TabsProps) {
  return (
    <KTabs
      class={`tbr-tabs ${props.class ?? ""}`}
      data-variant={props.variant ?? "underline"}
      data-size={props.size ?? "md"}
      value={props.value}
      onChange={(v) => props.onChange(v)}
    >
      <KTabs.List class="tbr-tabs-list" aria-label={props["aria-label"]}>
        <For each={props.tabs}>
          {(tab) => (
            <KTabs.Trigger class="tbr-tabs-trigger" value={tab.value}>
              {tab.label}
            </KTabs.Trigger>
          )}
        </For>
        <KTabs.Indicator class="tbr-tabs-indicator" />
      </KTabs.List>
      <For each={props.tabs}>
        {(tab) => (
          <KTabs.Content class="tbr-tabs-content" value={tab.value}>
            {tab.content}
          </KTabs.Content>
        )}
      </For>
    </KTabs>
  )
}
