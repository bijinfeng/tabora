import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Checkbox as Primitive } from "../../primitives/checkbox/checkbox"
import type { CheckboxProps } from "../../primitives/checkbox/checkbox"
import { toSolidStyle } from "../../stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    cursor: "pointer",
    display: "inline-flex",
    fontSize: 13,
    gap: 8,
    ":focus-within": {
      outline: "2px solid rgb(var(--tbr-color-focus))",
      outlineOffset: 2,
    },
  },
  rootDisabled: {
    cursor: "not-allowed",
    opacity: 0.45,
  },
  input: {
    clip: "rect(0, 0, 0, 0)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    width: 1,
  },
  control: {
    alignItems: "center",
    borderColor: "rgb(var(--tbr-color-line-strong))",
    borderRadius: "var(--tbr-radius-1)",
    borderStyle: "solid",
    borderWidth: 1.5,
    display: "flex",
    flexShrink: 0,
    height: 16,
    justifyContent: "center",
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: "var(--tbr-ease)",
    width: 16,
    ":hover": {
      borderColor: "rgb(var(--tbr-color-accent))",
    },
  },
  controlChecked: {
    backgroundColor: "rgb(var(--tbr-color-accent))",
    borderColor: "rgb(var(--tbr-color-accent))",
    color: "rgb(var(--tbr-color-inverse))",
  },
  label: {
    fontSize: 13,
  },
})

type CheckboxStyleProp =
  | "class"
  | "style"
  | "inputClass"
  | "inputStyle"
  | "controlClass"
  | "controlStyle"
  | "labelClass"
  | "labelStyle"

export type StyledCheckboxProps = Omit<CheckboxProps, CheckboxStyleProp> & {
  xstyle?: StyleXStyles
}

export function Checkbox(props: StyledCheckboxProps) {
  const rootCompiled = () =>
    stylex.props(styles.root, props.disabled && styles.rootDisabled, props.xstyle)
  const inputCompiled = () => stylex.props(styles.input)
  const controlCompiled = () =>
    stylex.props(
      styles.control,
      (props.checked === true || props.checked === "indeterminate") && styles.controlChecked,
    )
  const labelCompiled = () => stylex.props(styles.label)

  return (
    <Primitive
      {...props}
      class={rootCompiled().className}
      style={toSolidStyle(rootCompiled().style)}
      inputClass={inputCompiled().className}
      inputStyle={toSolidStyle(inputCompiled().style)}
      controlClass={controlCompiled().className}
      controlStyle={toSolidStyle(controlCompiled().style)}
      labelClass={labelCompiled().className}
      labelStyle={toSolidStyle(labelCompiled().style)}
    />
  )
}

export type { StyledCheckboxProps as CheckboxProps }
