import { Steps as Primitive } from "../../primitives/steps/steps"
import type { StepItem, StepsProps } from "../../primitives/steps/steps"
import "./styles.css"

export function Steps(props: StepsProps) {
  return <Primitive {...props} class={`tbr-steps ${props.class ?? ""}`} />
}

export type { StepItem, StepsProps }
