import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, motion, radius, shadow } from "@tabora/theme/tokens.stylex"
import { Switch as Primitive } from "../../primitives/switch/switch"
import type { SwitchProps } from "../../primitives/switch/switch"
import { sharedStyles } from "../sharedStyles.stylex"

const styles = stylex.create({
  root: {},
  rootDisabled: {},
  input: {},
  control: {
    backgroundColor: color.lineStrong,
    borderRadius: radius.pill,
    flexShrink: 0,
    position: "relative",
    transitionDuration: motion.normal,
    transitionProperty: "background-color",
    transitionTimingFunction: motion.ease,
  },
  controlChecked: {
    backgroundColor: color.accent,
  },
  controlSm: {
    height: 16,
    width: 28,
  },
  controlMd: {
    height: 20,
    width: 36,
  },
  thumb: {
    backgroundColor: color.surface,
    borderRadius: "50%",
    boxShadow: shadow.sm,
    left: 2,
    position: "absolute",
    top: 2,
    transitionDuration: motion.normal,
    transitionProperty: "left, opacity",
    transitionTimingFunction: motion.ease,
  },
  thumbSm: {
    height: 12,
    width: 12,
  },
  thumbMd: {
    height: 16,
    width: 16,
  },
  thumbCheckedSm: {
    left: 14,
  },
  thumbCheckedMd: {
    left: 18,
  },
  thumbLoading: {
    opacity: 0.3,
  },
  label: {},
})

type SwitchStyleProp =
  | "class"
  | "style"
  | "inputClass"
  | "inputStyle"
  | "controlClass"
  | "controlStyle"
  | "thumbClass"
  | "thumbStyle"
  | "labelClass"
  | "labelStyle"

export type StyledSwitchProps = Omit<SwitchProps, SwitchStyleProp> & {
  xstyle?: StyleXStyles
}

export function Switch(props: StyledSwitchProps) {
  const rootCompiled = () =>
    stylex.attrs(
      sharedStyles.choiceRoot,
      styles.root,
      (props.disabled || props.loading) && sharedStyles.choiceRootDisabled,
      props.xstyle,
    )
  const inputCompiled = () => stylex.attrs(sharedStyles.choiceInput, styles.input)
  const controlCompiled = () =>
    stylex.attrs(
      styles.control,
      props.checked && styles.controlChecked,
      props.size === "sm" && styles.controlSm,
      (!props.size || props.size === "md") && styles.controlMd,
    )
  const thumbCompiled = () =>
    stylex.attrs(
      styles.thumb,
      props.size === "sm" && styles.thumbSm,
      (!props.size || props.size === "md") && styles.thumbMd,
      props.checked && props.size === "sm" && styles.thumbCheckedSm,
      props.checked && (!props.size || props.size === "md") && styles.thumbCheckedMd,
      props.loading && styles.thumbLoading,
    )
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
      thumbClass={thumbCompiled().class}
      thumbStyle={undefined}
      labelClass={labelCompiled().class}
      labelStyle={undefined}
    />
  )
}

export type { StyledSwitchProps as SwitchProps }
