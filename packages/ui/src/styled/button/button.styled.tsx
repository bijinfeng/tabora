import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"
import type { JSX } from "solid-js"

import { HeadlessButton, HeadlessIconButton } from "../../primitives/button/button"
import type { HeadlessButtonProps, HeadlessIconButtonProps } from "../../primitives/button/button"

const styles = stylex.create({
  buttonBase: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: "var(--tbr-radius-control)",
    borderStyle: "solid",
    borderWidth: 1,
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    fontWeight: "var(--tbr-font-weight-semibold, 600)",
    gap: 6,
    justifyContent: "center",
    lineHeight: 1,
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "background-color, border-color, color, transform",
    transitionTimingFunction: "var(--tbr-ease)",
    whiteSpace: "nowrap",
    ":focus-visible": {
      boxShadow: "0 0 0 4px rgb(var(--tbr-color-focus) / 0.18)",
      outline: "2px solid rgb(var(--tbr-color-focus))",
      outlineOffset: 2,
    },
    ":disabled": {
      cursor: "not-allowed",
      opacity: 0.45,
    },
  },
  buttonFullWidth: {
    width: "100%",
  },
  buttonSm: {
    borderRadius: "var(--tbr-radius-2)",
    fontSize: 12,
    height: "var(--tbr-control-sm)",
    paddingBlock: 0,
    paddingInline: 10,
  },
  buttonMd: {
    fontSize: 13,
    height: "var(--tbr-control-md)",
    paddingBlock: 0,
    paddingInline: 12,
  },
  buttonLg: {
    fontSize: 14,
    height: "var(--tbr-control-lg)",
    paddingBlock: 0,
    paddingInline: 18,
  },
  primary: {
    backgroundColor: "rgb(var(--tbr-color-accent))",
    color: "rgb(var(--tbr-color-inverse))",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-accent-hover))",
    },
    ":active": {
      backgroundColor: "color-mix(in srgb, rgb(var(--tbr-color-accent-hover)) 90%, black)",
      transform: "translateY(1px)",
    },
  },
  secondary: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    color: "rgb(var(--tbr-color-text))",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-accent) / 0.08)",
      borderColor: "rgb(var(--tbr-color-line-strong))",
    },
    ":active": {
      backgroundColor: "rgb(var(--tbr-color-accent) / 0.14)",
    },
  },
  subtle: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    borderColor: "transparent",
    color: "rgb(var(--tbr-color-accent))",
    ":hover": {
      backgroundColor:
        "color-mix(in srgb, rgb(var(--tbr-color-accent-soft)) 70%, rgb(var(--tbr-color-accent)))",
    },
    ":active": {
      backgroundColor:
        "color-mix(in srgb, rgb(var(--tbr-color-accent-soft)) 50%, rgb(var(--tbr-color-accent)))",
    },
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    color: "rgb(var(--tbr-color-text-muted))",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-accent) / 0.06)",
      color: "rgb(var(--tbr-color-text))",
    },
    ":active": {
      backgroundColor: "rgb(var(--tbr-color-accent) / 0.12)",
    },
  },
  danger: {
    backgroundColor: "rgb(var(--tbr-color-danger))",
    color: "rgb(var(--tbr-color-inverse))",
    ":hover": {
      backgroundColor: "color-mix(in srgb, rgb(var(--tbr-color-danger)) 85%, black)",
    },
    ":active": {
      backgroundColor: "color-mix(in srgb, rgb(var(--tbr-color-danger)) 75%, black)",
      transform: "translateY(1px)",
    },
  },
  dangerSubtle: {
    backgroundColor: "rgb(var(--tbr-color-danger-soft))",
    borderColor: "transparent",
    color: "rgb(var(--tbr-color-danger))",
    ":hover": {
      backgroundColor:
        "color-mix(in srgb, rgb(var(--tbr-color-danger-soft)) 84%, rgb(var(--tbr-color-surface-hover)))",
    },
  },
  iconButtonBase: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: "var(--tbr-radius-control)",
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(var(--tbr-color-text-muted))",
    cursor: "pointer",
    display: "inline-flex",
    justifyContent: "center",
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: "var(--tbr-ease)",
    ":focus-visible": {
      outline: "2px solid rgb(var(--tbr-color-focus))",
      outlineOffset: 2,
    },
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-accent) / 0.08)",
      color: "rgb(var(--tbr-color-text))",
    },
    ":disabled": {
      cursor: "not-allowed",
      opacity: 0.45,
    },
  },
  iconSecondary: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    color: "rgb(var(--tbr-color-text))",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-accent) / 0.08)",
      borderColor: "rgb(var(--tbr-color-line-strong))",
    },
  },
  iconDanger: {
    color: "rgb(var(--tbr-color-danger))",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-danger) / 0.08)",
    },
  },
  iconSm: {
    borderRadius: "var(--tbr-radius-2)",
    height: 26,
    width: 26,
  },
  iconMd: {
    height: 32,
    width: 32,
  },
  iconLg: {
    height: 38,
    width: 38,
  },
})

export type ButtonProps = Omit<HeadlessButtonProps, "class" | "style"> & {
  xstyle?: StyleXStyles
}

export type IconButtonProps = Omit<HeadlessIconButtonProps, "class" | "style"> & {
  xstyle?: StyleXStyles
}

function toSolidStyle(
  style: ReturnType<typeof stylex.props>["style"],
): JSX.CSSProperties | undefined {
  return style as JSX.CSSProperties | undefined
}

export function Button(props: ButtonProps) {
  const compiled = () =>
    stylex.props(
      styles.buttonBase,
      props.variant === "primary" && styles.primary,
      (!props.variant || props.variant === "secondary") && styles.secondary,
      props.variant === "subtle" && styles.subtle,
      props.variant === "ghost" && styles.ghost,
      props.variant === "danger" && styles.danger,
      props.variant === "danger-subtle" && styles.dangerSubtle,
      props.size === "sm" && styles.buttonSm,
      (!props.size || props.size === "md") && styles.buttonMd,
      props.size === "lg" && styles.buttonLg,
      props.fullWidth && styles.buttonFullWidth,
      props.xstyle,
    )

  return (
    <HeadlessButton
      {...props}
      class={compiled().className}
      style={toSolidStyle(compiled().style)}
    />
  )
}

export function IconButton(props: IconButtonProps) {
  const compiled = () =>
    stylex.props(
      styles.iconButtonBase,
      props.variant === "secondary" && styles.iconSecondary,
      props.variant === "danger" && styles.iconDanger,
      props.size === "sm" && styles.iconSm,
      (!props.size || props.size === "md") && styles.iconMd,
      props.size === "lg" && styles.iconLg,
      props.xstyle,
    )

  return (
    <HeadlessIconButton
      {...props}
      class={compiled().className}
      style={toSolidStyle(compiled().style)}
    />
  )
}

export type ButtonVariant = HeadlessButtonProps["variant"]
export type ButtonSize = HeadlessButtonProps["size"]
