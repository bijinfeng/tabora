import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Switch as Primitive } from "../../primitives/switch/switch"
import type { SwitchProps } from "../../primitives/switch/switch"
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
    backgroundColor: "rgb(var(--tbr-color-line-strong))",
    borderRadius: 999,
    flexShrink: 0,
    position: "relative",
    transitionDuration: "var(--tbr-dur-normal)",
    transitionProperty: "background-color",
    transitionTimingFunction: "var(--tbr-ease)",
  },
  controlChecked: {
    backgroundColor: "rgb(var(--tbr-color-accent))",
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
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderRadius: "50%",
    boxShadow: "0 1px 2px rgb(var(--tbr-color-shadow) / 0.12)",
    left: 2,
    position: "absolute",
    top: 2,
    transitionDuration: "var(--tbr-dur-normal)",
    transitionProperty: "left, opacity",
    transitionTimingFunction: "var(--tbr-ease)",
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
    stylex.props(
      styles.root,
      (props.disabled || props.loading) && styles.rootDisabled,
      props.xstyle,
    )
  const inputCompiled = () => stylex.props(styles.input)
  const controlCompiled = () =>
    stylex.props(
      styles.control,
      props.checked && styles.controlChecked,
      props.size === "sm" && styles.controlSm,
      (!props.size || props.size === "md") && styles.controlMd,
    )
  const thumbCompiled = () =>
    stylex.props(
      styles.thumb,
      props.size === "sm" && styles.thumbSm,
      (!props.size || props.size === "md") && styles.thumbMd,
      props.checked && props.size === "sm" && styles.thumbCheckedSm,
      props.checked && (!props.size || props.size === "md") && styles.thumbCheckedMd,
      props.loading && styles.thumbLoading,
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
      thumbClass={thumbCompiled().className}
      thumbStyle={toSolidStyle(thumbCompiled().style)}
      labelClass={labelCompiled().className}
      labelStyle={toSolidStyle(labelCompiled().style)}
    />
  )
}

export type { StyledSwitchProps as SwitchProps }
