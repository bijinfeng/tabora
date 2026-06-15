import { Collapsible as KCollapsible } from "@kobalte/core/collapsible"
import type { JSX } from "solid-js"
import { ChevronRight } from "lucide-solid"

export type CollapsibleProps = {
  open?: boolean
  title: JSX.Element
  class?: string
  children: JSX.Element
}

export function Collapsible(props: CollapsibleProps) {
  return (
    <KCollapsible class={`tbr-collapsible ${props.class ?? ""}`} defaultOpen={props.open ?? false}>
      <KCollapsible.Trigger class="tbr-collapsible-trigger">
        {props.title}
        <span class="tbr-collapsible-arrow" aria-hidden="true">
          <ChevronRight size={16} strokeWidth={2} />
        </span>
      </KCollapsible.Trigger>
      <KCollapsible.Content class="tbr-collapsible-content">{props.children}</KCollapsible.Content>
    </KCollapsible>
  )
}
