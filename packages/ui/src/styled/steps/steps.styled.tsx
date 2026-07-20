import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Steps as Primitive } from "../../primitives/steps/steps"
import type { StepItem, StepsProps } from "../../primitives/steps/steps"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    alignItems: "flex-start",
    display: "flex",
    gap: 0,
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  step: {
    alignItems: "flex-start",
    display: "flex",
    flex: 1,
    gap: 8,
    minWidth: 0,
    position: "relative",
    ":not(:last-child)::after": {
      backgroundColor: "rgb(var(--tbr-color-line))",
      content: '""',
      height: 2,
      left: 28,
      position: "absolute",
      right: 8,
      top: 12,
    },
  },
  marker: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-pill)",
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(var(--tbr-color-text-muted))",
    display: "inline-flex",
    flex: "none",
    fontSize: 11,
    fontWeight: 700,
    height: 24,
    justifyContent: "center",
    width: 24,
    zIndex: 1,
  },
  markerActive: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    borderColor: "rgb(var(--tbr-color-accent))",
    color: "rgb(var(--tbr-color-accent))",
  },
  body: {
    color: "rgb(var(--tbr-color-text))",
    display: "grid",
    fontSize: 11,
    gap: 2,
    paddingRight: 12,
  },
  description: {
    color: "rgb(var(--tbr-color-text-muted))",
    lineHeight: 1.45,
  },
})

export type StyledStepsProps = StepsProps & {
  xstyle?: StyleXStyles
}

export function Steps(props: StyledStepsProps) {
  const rootCompiled = () => stylex.attrs(styles.root, props.xstyle)
  const stepCompiled = () => stylex.attrs(styles.step)
  const markerCompiled = () => stylex.attrs(styles.marker)
  const markerActiveCompiled = () => stylex.attrs(styles.markerActive)
  const bodyCompiled = () => stylex.attrs(styles.body)
  const descriptionCompiled = () => stylex.attrs(styles.description)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().class, props.class)}
      style={props.style}
      stepClass={joinClassNames(stepCompiled().class, props.stepClass)}
      stepStyle={props.stepStyle}
      markerClass={joinClassNames(markerCompiled().class, props.markerClass)}
      markerStyle={props.markerStyle}
      markerActiveClass={joinClassNames(markerActiveCompiled().class, props.markerActiveClass)}
      markerActiveStyle={{ ...props.markerActiveStyle }}
      bodyClass={joinClassNames(bodyCompiled().class, props.bodyClass)}
      bodyStyle={props.bodyStyle}
      descriptionClass={joinClassNames(descriptionCompiled().class, props.descriptionClass)}
      descriptionStyle={{ ...props.descriptionStyle }}
    />
  )
}

export type { StepItem, StyledStepsProps as StepsProps }
