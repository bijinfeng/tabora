import * as stylex from "@stylexjs/stylex"

import { color, font, motion, radius } from "@tabora/theme/tokens.stylex"
import { HeadlessButton, HeadlessIconButton } from "../../primitives/button/button"
import type { HeadlessButtonProps, HeadlessIconButtonProps } from "../../primitives/button/button"
import type { XStyle } from "../../stylex"

const styles = stylex.create({
  buttonBase: {
    alignItems: "center",
    borderColor: "transparent",
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    fontWeight: font.semibold,
    gap: 6,
    justifyContent: "center",
    lineHeight: 1,
    transitionDuration: motion.fast,
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: motion.ease,
    whiteSpace: "nowrap",
    ":focus-visible": {
      boxShadow: "0 0 0 4px rgb(var(--tbr-color-accent) / 0.18)",
      outline: `2px solid ${color.focus}`,
      outlineOffset: 2,
    },
    ":disabled": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
  buttonFullWidth: {
    width: "100%",
  },
  buttonSm: {
    borderRadius: radius.control,
    fontSize: 12,
    height: 28,
    paddingBlock: 0,
    paddingInline: 10,
  },
  buttonMd: {
    fontSize: 13,
    height: 36,
    paddingBlock: 0,
    paddingInline: 12,
  },
  buttonLg: {
    fontSize: 14,
    height: 44,
    paddingBlock: 0,
    paddingInline: 18,
  },
  primary: {
    backgroundColor: color.accent,
    borderColor: color.accent,
    color: color.inverse,
    ":hover": {
      backgroundColor: color.accentHover,
      borderColor: color.accentHover,
    },
    ":active": {
      backgroundColor: color.accentHover,
    },
  },
  secondary: {
    backgroundColor: color.surface,
    borderColor: color.line,
    color: color.text,
    ":hover": {
      backgroundColor: color.surfaceHover,
      borderColor: color.lineStrong,
    },
    ":active": {
      backgroundColor: color.surfaceHover,
    },
  },
  subtle: {
    backgroundColor: color.accentSoft,
    borderColor: "transparent",
    color: color.accent,
    ":hover": {
      backgroundColor:
        "color-mix(in srgb, rgb(var(--tbr-color-accent-soft)) 78%, rgb(var(--tbr-color-surface-hover)))",
    },
    ":active": {
      backgroundColor:
        "color-mix(in srgb, rgb(var(--tbr-color-accent-soft)) 60%, rgb(var(--tbr-color-surface-hover)))",
    },
  },
  ghost: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    color: color.textMuted,
    ":hover": {
      backgroundColor: color.surfaceHover,
      color: color.text,
    },
    ":active": {
      backgroundColor: color.surfaceHover,
    },
  },
  danger: {
    backgroundColor: color.danger,
    borderColor: color.danger,
    color: color.inverse,
    ":hover": {
      backgroundColor:
        "color-mix(in srgb, rgb(var(--tbr-color-danger)) 86%, rgb(var(--tbr-color-text)))",
      borderColor:
        "color-mix(in srgb, rgb(var(--tbr-color-danger)) 86%, rgb(var(--tbr-color-text)))",
    },
    ":active": {
      backgroundColor:
        "color-mix(in srgb, rgb(var(--tbr-color-danger)) 78%, rgb(var(--tbr-color-text)))",
    },
  },
  dangerSubtle: {
    backgroundColor: color.dangerSoft,
    borderColor: "transparent",
    color: color.danger,
    ":hover": {
      backgroundColor:
        "color-mix(in srgb, rgb(var(--tbr-color-danger-soft)) 84%, rgb(var(--tbr-color-surface-hover)))",
    },
  },
  iconButtonBase: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.textMuted,
    cursor: "pointer",
    display: "inline-flex",
    justifyContent: "center",
    transitionDuration: motion.fast,
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: motion.ease,
    ":focus-visible": {
      boxShadow: "0 0 0 4px rgb(var(--tbr-color-accent) / 0.18)",
      outline: `2px solid ${color.focus}`,
      outlineOffset: 2,
    },
    ":hover": {
      backgroundColor: color.surfaceHover,
      color: color.text,
    },
    ":disabled": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
  iconSecondary: {
    backgroundColor: color.surface,
    borderColor: color.line,
    color: color.text,
    ":hover": {
      backgroundColor: color.surfaceHover,
      borderColor: color.lineStrong,
    },
  },
  iconDanger: {
    color: color.danger,
    ":hover": {
      backgroundColor: color.dangerSoft,
    },
  },
  iconSm: {
    borderRadius: radius.control,
    height: 26,
    width: 26,
  },
  iconMd: {
    borderRadius: radius.panel,
    height: 32,
    width: 32,
  },
  iconLg: {
    borderRadius: radius.panel,
    height: 38,
    width: 38,
  },
})

export type ButtonProps = Omit<HeadlessButtonProps, "class" | "style"> & {
  xstyle?: XStyle
}

export type IconButtonProps = Omit<HeadlessIconButtonProps, "class"> & {
  xstyle?: XStyle
}

const buttonVariantStyles = {
  primary: styles.primary,
  secondary: styles.secondary,
  subtle: styles.subtle,
  ghost: styles.ghost,
  danger: styles.danger,
  "danger-subtle": styles.dangerSubtle,
} as const

const buttonSizeStyles = {
  sm: styles.buttonSm,
  md: styles.buttonMd,
  lg: styles.buttonLg,
} as const

const iconButtonVariantStyles = {
  ghost: null,
  secondary: styles.iconSecondary,
  danger: styles.iconDanger,
} as const

const iconButtonSizeStyles = {
  sm: styles.iconSm,
  md: styles.iconMd,
  lg: styles.iconLg,
} as const

export function Button(props: ButtonProps) {
  const attrs = () =>
    stylex.attrs(
      styles.buttonBase,
      buttonVariantStyles[props.variant ?? "secondary"],
      buttonSizeStyles[props.size ?? "md"],
      props.fullWidth && styles.buttonFullWidth,
      props.xstyle,
    )

  return <HeadlessButton {...props} {...attrs()} />
}

export function IconButton(props: IconButtonProps) {
  const attrs = () =>
    stylex.attrs(
      styles.iconButtonBase,
      iconButtonVariantStyles[props.variant ?? "ghost"],
      iconButtonSizeStyles[props.size ?? "md"],
      props.xstyle,
    )

  return <HeadlessIconButton {...props} class={attrs().class} style={props.style} />
}

export type ButtonVariant = HeadlessButtonProps["variant"]
export type ButtonSize = HeadlessButtonProps["size"]
