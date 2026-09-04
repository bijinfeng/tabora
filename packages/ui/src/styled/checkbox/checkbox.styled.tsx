import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, motion, radius } from "@tabora/theme/tokens.stylex"
import { Checkbox as Primitive } from "../../primitives/checkbox/checkbox"
import type { CheckboxProps } from "../../primitives/checkbox/checkbox"
import { sharedStyles } from "../sharedStyles.stylex"

const styles = stylex.create({
  root: {},
  rootDisabled: {},
  input: {},
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
  indicator: {
    alignItems: "center",
    display: "flex",
    height: "100%",
    justifyContent: "center",
    lineHeight: 0,
    width: "100%",
  },
  label: {},
})

type CheckboxStyleProp =
  | "class"
  | "style"
  | "inputClass"
  | "inputStyle"
  | "controlClass"
  | "controlStyle"
  | "indicatorClass"
  | "indicatorStyle"
  | "labelClass"
  | "labelStyle"

export type StyledCheckboxProps = Omit<CheckboxProps, CheckboxStyleProp> & {
  xstyle?: StyleXStyles
}

export function Checkbox(props: StyledCheckboxProps) {
  const rootCompiled = () =>
    stylex.attrs(
      sharedStyles.choiceRoot,
      styles.root,
      props.disabled && sharedStyles.choiceRootDisabled,
      props.xstyle,
    )
  const inputCompiled = () => stylex.attrs(sharedStyles.choiceInput, styles.input)
  const controlCompiled = () =>
    stylex.attrs(
      styles.control,
      (props.checked === true || props.checked === "indeterminate") && styles.controlChecked,
    )
  const indicatorCompiled = () => stylex.attrs(styles.indicator)
  const labelCompiled = () => stylex.attrs(sharedStyles.choiceLabel, styles.label)

  return (
    <Primitive
      {...props}
      class={rootCompiled().class}
      style={undefined}
      inputClass={inputCompiled().class}
      inputStyle={undefined}
      controlClass={controlCompiled().class}
      controlStyle={undefined}
      indicatorClass={indicatorCompiled().class}
      indicatorStyle={undefined}
      labelClass={labelCompiled().class}
      labelStyle={undefined}
    />
  )
}

export type { StyledCheckboxProps as CheckboxProps }
