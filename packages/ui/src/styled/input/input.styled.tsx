import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { HeadlessInput } from "../../primitives/input/input"
import type { HeadlessInputProps } from "../../primitives/input/input"

const styles = stylex.create({
  wrapper: {
    display: "inline-flex",
    position: "relative",
    width: "100%",
  },
  control: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(var(--tbr-color-text))",
    display: "block",
    fontFamily: "inherit",
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "border-color, box-shadow",
    transitionTimingFunction: "var(--tbr-ease)",
    width: "100%",
    "::placeholder": {
      color: "rgb(var(--tbr-color-text-muted))",
    },
    ":hover": {
      borderColor: "rgb(var(--tbr-color-line-strong))",
    },
    ":focus": {
      borderColor: "rgb(var(--tbr-color-accent))",
      boxShadow: "0 0 0 3px rgb(var(--tbr-color-accent) / 0.18)",
      outline: "none",
    },
    ":disabled": {
      backgroundColor: "rgb(var(--tbr-color-line) / 0.4)",
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
  sm: {
    fontSize: 12,
    height: "var(--tbr-control-sm)",
    paddingBlock: 0,
    paddingInline: 10,
  },
  md: {
    fontSize: 13,
    height: "var(--tbr-control-md)",
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
    borderColor: "rgb(var(--tbr-color-danger))",
  },
  sideIcon: {
    alignItems: "center",
    color: "rgb(var(--tbr-color-text-muted))",
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
    borderRadius: 3,
    color: "rgb(var(--tbr-color-text-muted))",
    cursor: "pointer",
    display: "inline-flex",
    height: 20,
    justifyContent: "center",
    padding: 0,
    position: "absolute",
    right: 8,
    top: "50%",
    transform: "translateY(-50%)",
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "background-color, color",
    transitionTimingFunction: "var(--tbr-ease)",
    width: 20,
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-line) / 0.5)",
      color: "rgb(var(--tbr-color-text))",
    },
  },
  trailingButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    color: "rgb(var(--tbr-color-text-muted))",
    cursor: "pointer",
    display: "inline-flex",
    justifyContent: "center",
    padding: 0,
    position: "absolute",
    right: 10,
    top: "50%",
    transform: "translateY(-50%)",
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "color",
    transitionTimingFunction: "var(--tbr-ease)",
    ":hover": {
      color: "rgb(var(--tbr-color-text))",
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
  xstyle?: StyleXStyles
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
