import * as stylex from "@stylexjs/stylex"

import { color, motion, radius } from "@tabora/theme/tokens.stylex"
import { HeadlessInput } from "../../primitives/input/input"
import type { HeadlessInputProps } from "../../primitives/input/input"
import type { XStyle } from "../../stylex"

const styles = stylex.create({
  wrapper: {
    display: "inline-flex",
    position: "relative",
    width: "100%",
  },
  control: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.text,
    display: "block",
    fontFamily: "inherit",
    transitionDuration: motion.fast,
    transitionProperty: "border-color, box-shadow",
    transitionTimingFunction: motion.ease,
    width: "100%",
    "::placeholder": {
      color: color.textSubtle,
    },
    ":hover": {
      borderColor: color.lineStrong,
    },
    ":focus": {
      borderColor: color.accent,
      boxShadow: "0 0 0 3px rgb(var(--tbr-color-accent) / 0.12)",
      outline: "none",
    },
    ":disabled": {
      backgroundColor: color.surfaceSoft,
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
  sm: {
    fontSize: 12,
    height: 28,
    paddingBlock: 0,
    paddingInline: 10,
  },
  md: {
    fontSize: 13,
    height: 36,
    paddingBlock: 0,
    paddingInline: 12,
  },
  hasLeading: {
    paddingLeft: 34,
  },
  hasLeadingSm: {
    paddingLeft: 30,
  },
  hasTrailing: {
    paddingRight: 36,
  },
  hasTrailingSm: {
    paddingRight: 32,
  },
  invalid: {
    borderColor: color.danger,
  },
  sideIcon: {
    alignItems: "center",
    color: color.textMuted,
    display: "inline-flex",
    fontSize: 13,
    justifyContent: "center",
    pointerEvents: "none",
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
  },
  sideIconSm: {
    fontSize: 12,
  },
  leadingIcon: {
    left: 10,
  },
  leadingIconSm: {
    left: 8,
  },
  trailingIcon: {
    right: 10,
  },
  trailingIconSm: {
    right: 8,
  },
  clearButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: radius.r1,
    color: color.textMuted,
    cursor: "pointer",
    display: "inline-flex",
    height: 20,
    justifyContent: "center",
    padding: 0,
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    transitionDuration: motion.fast,
    transitionProperty: "background-color, color",
    transitionTimingFunction: motion.ease,
    width: 20,
    ":hover": {
      backgroundColor: color.surfaceHover,
      color: color.text,
    },
  },
  trailingButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    color: color.textMuted,
    cursor: "pointer",
    display: "inline-flex",
    justifyContent: "center",
    padding: 0,
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    transitionDuration: motion.fast,
    transitionProperty: "color",
    transitionTimingFunction: motion.ease,
    ":hover": {
      color: color.text,
    },
  },
})

type HeadlessInputStyleProp =
  | "class"
  | "style"
  | "controlAttrs"
  | "wrapperClass"
  | "wrapperStyle"
  | "wrapperAttrs"
  | "leadingIconClass"
  | "leadingIconStyle"
  | "leadingIconAttrs"
  | "trailingIconClass"
  | "trailingIconStyle"
  | "trailingIconAttrs"
  | "clearButtonClass"
  | "clearButtonStyle"
  | "clearButtonAttrs"
  | "trailingButtonClass"
  | "trailingButtonStyle"
  | "trailingButtonAttrs"

export type InputProps = Omit<HeadlessInputProps, HeadlessInputStyleProp> & {
  xstyle?: XStyle
}

export function Input(props: InputProps) {
  const controlAttrs = () =>
    stylex.attrs(
      styles.control,
      props.size === "sm" && styles.sm,
      (!props.size || props.size === "md") && styles.md,
      Boolean(props.leadingIcon) && props.size === "sm" && styles.hasLeadingSm,
      Boolean(props.leadingIcon) && props.size !== "sm" && styles.hasLeading,
      (Boolean(props.trailingIcon) || Boolean(props.clearable) || props.type === "password") &&
        props.size === "sm" &&
        styles.hasTrailingSm,
      (Boolean(props.trailingIcon) || Boolean(props.clearable) || props.type === "password") &&
        props.size !== "sm" &&
        styles.hasTrailing,
      props.invalid && styles.invalid,
      !(
        Boolean(props.leadingIcon) ||
        Boolean(props.trailingIcon) ||
        Boolean(props.clearable) ||
        props.type === "password"
      ) && props.xstyle,
    )
  const wrapperAttrs = () =>
    stylex.attrs(
      styles.wrapper,
      (Boolean(props.leadingIcon) ||
        Boolean(props.trailingIcon) ||
        Boolean(props.clearable) ||
        props.type === "password") &&
        props.xstyle,
    )
  const leadingIconAttrs = () =>
    stylex.attrs(
      styles.sideIcon,
      styles.leadingIcon,
      props.size === "sm" && styles.sideIconSm,
      props.size === "sm" && styles.leadingIconSm,
    )
  const trailingIconAttrs = () =>
    stylex.attrs(
      styles.sideIcon,
      styles.trailingIcon,
      props.size === "sm" && styles.sideIconSm,
      props.size === "sm" && styles.trailingIconSm,
    )
  const clearButtonAttrs = () => stylex.attrs(styles.clearButton)
  const trailingButtonAttrs = () => stylex.attrs(styles.trailingButton)

  return (
    <HeadlessInput
      {...props}
      controlAttrs={controlAttrs()}
      wrapperAttrs={wrapperAttrs()}
      leadingIconAttrs={leadingIconAttrs()}
      trailingIconAttrs={trailingIconAttrs()}
      clearButtonAttrs={clearButtonAttrs()}
      trailingButtonAttrs={trailingButtonAttrs()}
    />
  )
}

export type InputSize = HeadlessInputProps["size"]
export type InputType = HeadlessInputProps["type"]
