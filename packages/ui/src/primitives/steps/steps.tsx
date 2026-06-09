import type { JSX } from "solid-js"
import { For } from "solid-js"

export type StepItem = {
  title: JSX.Element
  description?: JSX.Element
}

export type StepsProps = {
  steps: StepItem[]
  current: number
  class?: string
}

export function Steps(props: StepsProps) {
  return (
    <ol class={props.class}>
      <For each={props.steps}>
        {(step, index) => (
          <li
            class="tbr-step"
            data-state={
              index() < props.current
                ? "complete"
                : index() === props.current
                  ? "active"
                  : "pending"
            }
          >
            <span class="tbr-step-marker">{index() + 1}</span>
            <span class="tbr-step-body">
              <strong>{step.title}</strong>
              {step.description && <span>{step.description}</span>}
            </span>
          </li>
        )}
      </For>
    </ol>
  )
}
