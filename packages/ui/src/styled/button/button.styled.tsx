import * as stylex from "@stylexjs/stylex"
import type { Component, JSX } from "solid-js"

import { color, control, font, motion, radius } from "@tabora/theme/tokens.stylex"
import { HeadlessButton, HeadlessIconButton } from "../../primitives/button/button"
import type {
  HeadlessButtonProps,
  HeadlessIconButtonProps,
  ButtonShape,
  IconPlacement,
} from "../../primitives/button/button"
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
    textDecoration: "none",
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
  buttonRound: {
    borderRadius: radius.pill,
  },
  buttonCircle: {
    borderRadius: "50%",
  },
  buttonSm: {
    borderRadius: radius.control,
    fontSize: 12,
    height: control.sm,
    paddingBlock: 0,
    paddingInline: 8,
  },
  buttonMini: {
    borderRadius: radius.control,
    fontSize: 11,
    height: control.sm,
    paddingBlock: 0,
    paddingInline: 6,
  },
  buttonMiniCircle: {
    paddingInline: 0,
    width: control.sm,
  },
  buttonSmCircle: {
    paddingInline: 0,
    width: control.sm,
  },
  buttonMd: {
    fontSize: 13,
    height: control.md,
    paddingBlock: 0,
    paddingInline: 12,
  },
  buttonMdCircle: {
    paddingInline: 0,
    width: control.md,
  },
  buttonLg: {
    fontSize: 14,
    height: control.lg,
    paddingBlock: 0,
    paddingInline: 18,
  },
  buttonLgCircle: {
    paddingInline: 0,
    width: control.lg,
  },
  buttonDisabled: {
    backgroundColor: color.surfaceSoft,
    borderColor: color.line,
    color: color.textSubtle,
    opacity: 1,
    ":hover": {
      backgroundColor: color.surfaceSoft,
      borderColor: color.line,
      color: color.textSubtle,
    },
  },
  buttonDisabledTransparent: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    color: color.textSubtle,
    opacity: 1,
    ":hover": {
      backgroundColor: "transparent",
      borderColor: "transparent",
      color: color.textSubtle,
    },
  },
  buttonDisabledSubtle: {
    backgroundColor:
      "color-mix(in srgb, rgb(var(--tbr-color-accent-soft)) 55%, rgb(var(--tbr-color-surface-soft)))",
    borderColor: "transparent",
    color:
      "color-mix(in srgb, rgb(var(--tbr-color-accent)) 60%, rgb(var(--tbr-color-text-subtle)))",
    opacity: 1,
    ":hover": {
      backgroundColor:
        "color-mix(in srgb, rgb(var(--tbr-color-accent-soft)) 55%, rgb(var(--tbr-color-surface-soft)))",
      borderColor: "transparent",
      color:
        "color-mix(in srgb, rgb(var(--tbr-color-accent)) 60%, rgb(var(--tbr-color-text-subtle)))",
    },
  },
  buttonDisabledDangerSubtle: {
    backgroundColor:
      "color-mix(in srgb, rgb(var(--tbr-color-danger-soft)) 55%, rgb(var(--tbr-color-surface-soft)))",
    borderColor: "transparent",
    color:
      "color-mix(in srgb, rgb(var(--tbr-color-danger)) 60%, rgb(var(--tbr-color-text-subtle)))",
    opacity: 1,
    ":hover": {
      backgroundColor:
        "color-mix(in srgb, rgb(var(--tbr-color-danger-soft)) 55%, rgb(var(--tbr-color-surface-soft)))",
      borderColor: "transparent",
      color:
        "color-mix(in srgb, rgb(var(--tbr-color-danger)) 60%, rgb(var(--tbr-color-text-subtle)))",
    },
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
  link: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    color: color.accent,
    fontWeight: font.medium,
    textDecoration: "none",
    ":hover": {
      backgroundColor: "transparent",
      borderColor: "transparent",
      color: color.accentHover,
      textDecoration: "underline",
    },
    ":active": {
      backgroundColor: "transparent",
      color: color.accentHover,
    },
  },
  linkLayout: {
    height: "auto",
    minHeight: control.sm,
    paddingInline: 0,
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
  iconSm: {
    height: control.sm,
    width: control.sm,
  },
  iconMini: {
    height: control.sm,
    width: control.sm,
  },
  iconMd: {
    height: control.md,
    width: control.md,
  },
  iconLg: {
    height: control.lg,
    width: control.lg,
  },
  iconRound: {
    borderRadius: radius.pill,
  },
  iconCircle: {
    borderRadius: "50%",
  },
})

type ButtonIconProps = {
  size: number
  strokeWidth: number
}

type ButtonIcon = Component<ButtonIconProps>

export type ButtonProps = Omit<HeadlessButtonProps, "class" | "style" | "icon"> & {
  /** Accept both the historical JSX element form and a component for size-aware icons. */
  icon?: JSX.Element | ButtonIcon
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
  link: styles.link,
  danger: styles.danger,
  "danger-subtle": styles.dangerSubtle,
} as const

const buttonSizeStyles = {
  mini: styles.buttonMini,
  sm: styles.buttonSm,
  md: styles.buttonMd,
  lg: styles.buttonLg,
} as const

const buttonIconSizes = {
  mini: 12,
  sm: 12,
  md: 16,
  lg: 18,
} as const

const buttonShapeStyles: Record<Exclude<ButtonShape, "default">, typeof styles.buttonRound> = {
  round: styles.buttonRound,
  circle: styles.buttonCircle,
}

const buttonSizeCircleStyles = {
  mini: styles.buttonMiniCircle,
  sm: styles.buttonSmCircle,
  md: styles.buttonMdCircle,
  lg: styles.buttonLgCircle,
} as const

const iconButtonSizeStyles = {
  mini: styles.iconMini,
  sm: styles.iconSm,
  md: styles.iconMd,
  lg: styles.iconLg,
} as const

const iconButtonShapeStyles: Record<Exclude<ButtonShape, "default">, typeof styles.iconRound> = {
  round: styles.iconRound,
  circle: styles.iconCircle,
}

export function Button(props: ButtonProps) {
  const shape: ButtonShape = props.shape ?? "default"
  const variant = props.variant ?? "secondary"
  const size = props.size ?? "md"
  const icon =
    typeof props.icon === "function"
      ? props.icon({ size: buttonIconSizes[size], strokeWidth: 2 })
      : props.icon
  const disabledStyle = (() => {
    if (!props.disabled) return undefined
    switch (variant) {
      case "ghost":
      case "link":
        return styles.buttonDisabledTransparent
      case "subtle":
        return styles.buttonDisabledSubtle
      case "danger-subtle":
        return styles.buttonDisabledDangerSubtle
      default:
        return styles.buttonDisabled
    }
  })()
  const attrs = () =>
    stylex.attrs(
      styles.buttonBase,
      buttonVariantStyles[variant],
      buttonSizeStyles[size],
      shape !== "default" && buttonShapeStyles[shape],
      shape === "circle" && buttonSizeCircleStyles[size],
      disabledStyle,
      variant === "link" && styles.linkLayout,
      props.fullWidth && styles.buttonFullWidth,
      props.xstyle,
    )

  return <HeadlessButton {...props} icon={icon} {...attrs()} />
}

export function IconButton(props: IconButtonProps) {
  const variant = props.variant ?? "ghost"
  const shape: ButtonShape = props.shape ?? "default"
  const disabledStyle = (() => {
    if (!props.disabled) return undefined
    switch (variant) {
      case "ghost":
      case "link":
        return styles.buttonDisabledTransparent
      case "subtle":
        return styles.buttonDisabledSubtle
      case "danger-subtle":
        return styles.buttonDisabledDangerSubtle
      default:
        return styles.buttonDisabled
    }
  })()
  const attrs = () =>
    stylex.attrs(
      styles.buttonBase,
      buttonVariantStyles[variant],
      variant === "link" && styles.linkLayout,
      iconButtonSizeStyles[props.size ?? "md"],
      shape !== "default" && iconButtonShapeStyles[shape],
      disabledStyle,
      props.xstyle,
    )

  return <HeadlessIconButton {...props} class={attrs().class} style={props.style} />
}

export type ButtonVariant = HeadlessButtonProps["variant"]
export type ButtonSize = HeadlessButtonProps["size"]
export type { ButtonShape, IconPlacement, HeadlessButtonProps, HeadlessIconButtonProps }
