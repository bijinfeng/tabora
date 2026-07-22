import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, motion, radius, shadow } from "@tabora/theme/tokens.stylex"
import { Switch as Primitive } from "../../primitives/switch/switch"
import type { SwitchProps } from "../../primitives/switch/switch"

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
  label: {
    fontSize: 13,
  },
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
      styles.root,
      (props.disabled || props.loading) && styles.rootDisabled,
      props.xstyle,
    )
  const inputCompiled = () => stylex.attrs(styles.input)
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
      thumbClass={thumbCompiled().class}
      thumbStyle={undefined}
      labelClass={labelCompiled().class}
      labelStyle={undefined}
    />
  )
}

export type { StyledSwitchProps as SwitchProps }
