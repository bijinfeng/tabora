import { Tabs as KTabs } from "@kobalte/core/tabs"
import type { JSX } from "solid-js"
import { For } from "solid-js"

export type TabsProps = {
  value: string
  onChange: (value: string) => void
  tabs: { value: string; label: JSX.Element; content: JSX.Element }[]
  "aria-label": string
}

export function Tabs(props: TabsProps) {
  return (
    <KTabs class="tabora-tabs" value={props.value} onChange={(v) => props.onChange(v)}>
      <KTabs.List class="tabora-tabs-list" aria-label={props["aria-label"]}>
        <For each={props.tabs}>
          {(tab) => (
            <KTabs.Trigger class="tabora-tabs-trigger" value={tab.value}>
              {tab.label}
            </KTabs.Trigger>
          )}
        </For>
        <KTabs.Indicator class="tabora-tabs-indicator" />
      </KTabs.List>
      <For each={props.tabs}>
        {(tab) => (
          <KTabs.Content class="tabora-tabs-content" value={tab.value}>
            {tab.content}
          </KTabs.Content>
        )}
      </For>
    </KTabs>
  )
}
