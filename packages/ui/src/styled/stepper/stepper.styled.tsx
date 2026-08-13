import * as stylex from "@stylexjs/stylex"
import { splitProps } from "solid-js"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, font, motion, radius } from "@tabora/theme/tokens.stylex"
import { Stepper as Primitive } from "../../primitives/stepper/stepper"
import type { StepperProps } from "../../primitives/stepper/stepper"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    display: "inline-flex",
    height: 30,
    overflow: "hidden",
  },
  button: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 0,
    borderStyle: "none",
    borderWidth: 0,
    color: color.textMuted,
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: font.sans,
    fontSize: 14,
    fontWeight: font.bold,
    height: "100%",
    justifyContent: "center",
    paddingBlock: 0,
    paddingInline: 0,
    transitionDuration: motion.fast,
    transitionProperty: "background-color, color",
    transitionTimingFunction: motion.ease,
    width: 28,
    ":hover": {
      backgroundColor: color.surfaceHover,
      color: color.text,
    },
    ":active": {
      backgroundColor: color.surfaceHover,
    },
    ":focus-visible": {
      boxShadow: `inset 0 0 0 2px ${color.focus}`,
      outline: "none",
    },
    ":disabled": {
      backgroundColor: "transparent",
      color: color.textSubtle,
      cursor: "not-allowed",
      opacity: 0.45,
    },
  },
  value: {
    alignItems: "center",
    borderInlineColor: color.line,
    borderInlineStyle: "solid",
    borderInlineWidth: 1,
    color: color.text,
    display: "inline-flex",
    fontFamily: font.sans,
    fontSize: 11,
    fontWeight: font.bold,
    height: "100%",
    justifyContent: "center",
    minWidth: 42,
    paddingInline: 8,
  },
})

type StepperStyleProp =
  | "class"
  | "style"
  | "decrementClass"
  | "decrementStyle"
  | "valueClass"
  | "valueStyle"
  | "incrementClass"
  | "incrementStyle"

export type StyledStepperProps = Omit<StepperProps, StepperStyleProp> & {
  xstyle?: StyleXStyles
}

export function Stepper(props: StyledStepperProps) {
  const [local, primitiveProps] = splitProps(props, ["xstyle"])
  const rootCompiled = () => stylex.attrs(styles.root, local.xstyle)
  const buttonCompiled = () => stylex.attrs(styles.button)
  const valueCompiled = () => stylex.attrs(styles.value)

  return (
    <Primitive
      {...primitiveProps}
      class={rootCompiled().class}
      style={undefined}
      decrementClass={buttonCompiled().class}
      decrementStyle={undefined}
      valueClass={valueCompiled().class}
      valueStyle={undefined}
      incrementClass={buttonCompiled().class}
      incrementStyle={undefined}
    />
  )
}

export type { StyledStepperProps as StepperProps }
