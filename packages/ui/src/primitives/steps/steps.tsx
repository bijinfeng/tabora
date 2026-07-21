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
        {(step, index) => <Step step={step} index={index()} props={props} />}
      </For>
    </ol>
  )
}

function Step(props: { step: StepItem; index: number; props: StepsProps }) {
  const state = () =>
    props.index < props.props.current
      ? "complete"
      : props.index === props.props.current
        ? "active"
        : "pending"

  return (
    <li class={props.props.stepClass} style={props.props.stepStyle} data-state={state()}>
      <span
        class={[
          props.props.markerClass,
          props.index <= props.props.current ? props.props.markerActiveClass : undefined,
        ]
          .filter(Boolean)
          .join(" ")}
        style={
          props.index <= props.props.current
            ? { ...props.props.markerStyle, ...props.props.markerActiveStyle }
            : props.props.markerStyle
        }
        data-state={state()}
      >
        {props.index + 1}
      </span>
      <span class={props.props.bodyClass} style={props.props.bodyStyle} data-state={state()}>
        <strong class={props.props.titleClass} style={props.props.titleStyle}>
          {props.step.title}
        </strong>
        {props.step.description && (
          <span class={props.props.descriptionClass} style={props.props.descriptionStyle}>
            {props.step.description}
          </span>
        )}
      </span>
    </li>
  )
}
