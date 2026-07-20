import type { JSX } from "solid-js"
import { For } from "solid-js"

export type StepItem = {
  title: JSX.Element
  description?: JSX.Element
}

export type StepsProps = {
  steps: StepItem[]
  current: number
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  stepClass?: string | undefined
  stepStyle?: JSX.CSSProperties | undefined
  markerClass?: string | undefined
  markerStyle?: JSX.CSSProperties | undefined
  markerActiveClass?: string | undefined
  markerActiveStyle?: JSX.CSSProperties | undefined
  bodyClass?: string | undefined
  bodyStyle?: JSX.CSSProperties | undefined
  titleClass?: string | undefined
  titleStyle?: JSX.CSSProperties | undefined
  descriptionClass?: string | undefined
  descriptionStyle?: JSX.CSSProperties | undefined
}

export function Steps(props: StepsProps) {
  return (
    <ol class={props.class} style={props.style}>
      <For each={props.steps}>
        {(step, index) => (
          <li
            class={props.stepClass}
            style={props.stepStyle}
            data-state={
              index() < props.current
                ? "complete"
                : index() === props.current
                  ? "active"
                  : "pending"
            }
          >
            <span
              class={[
                props.markerClass,
                index() <= props.current ? props.markerActiveClass : undefined,
              ]
                .filter(Boolean)
                .join(" ")}
              style={
                index() <= props.current
                  ? { ...props.markerStyle, ...props.markerActiveStyle }
                  : props.markerStyle
              }
            >
              {index() + 1}
            </span>
            <span class={props.bodyClass} style={props.bodyStyle}>
              <strong class={props.titleClass} style={props.titleStyle}>
                {step.title}
              </strong>
              {step.description && (
                <span class={props.descriptionClass} style={props.descriptionStyle}>
                  {step.description}
                </span>
              )}
            </span>
          </li>
        )}
      </For>
    </ol>
  )
}
