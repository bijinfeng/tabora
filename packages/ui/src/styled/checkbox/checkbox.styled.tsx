import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, motion, radius } from "@tabora/theme/tokens.stylex"
import { Checkbox as Primitive } from "../../primitives/checkbox/checkbox"
import type { CheckboxProps } from "../../primitives/checkbox/checkbox"

const styles = stylex.create({
  root: {
    alignItems: "center",
    cursor: "pointer",
    display: "inline-flex",
    fontSize: 13,
    gap: 8,
    ":focus-within": {
      outline: `2px solid ${color.focus}`,
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
    borderColor: color.lineStrong,
    borderRadius: radius.r1,
    borderStyle: "solid",
    borderWidth: 1.5,
    display: "flex",
    flexShrink: 0,
    height: 16,
    justifyContent: "center",
    transitionDuration: motion.fast,
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: motion.ease,
    width: 16,
    ":hover": {
      borderColor: color.accent,
    },
  },
  controlChecked: {
    backgroundColor: color.accent,
    borderColor: color.accent,
    color: color.inverse,
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
    stylex.attrs(styles.root, props.disabled && styles.rootDisabled, props.xstyle)
  const inputCompiled = () => stylex.attrs(styles.input)
  const controlCompiled = () =>
    stylex.attrs(
      styles.control,
      (props.checked === true || props.checked === "indeterminate") && styles.controlChecked,
    )
  const labelCompiled = () => stylex.attrs(styles.label)

  return (
    <Primitive
      {...props}
      class={rootCompiled().class}
      style={undefined}
      inputClass={inputCompiled().class}
      inputStyle={undefined}
      controlClass={controlCompiled().class}
      controlStyle={undefined}
      labelClass={labelCompiled().class}
      labelStyle={undefined}
    />
  )
}

export type { StyledCheckboxProps as CheckboxProps }
