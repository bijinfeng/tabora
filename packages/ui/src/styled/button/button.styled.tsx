import * as stylex from "@stylexjs/stylex"

import { color, font, motion, radius } from "@tabora/theme/tokens.stylex"
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
    height: 28,
    paddingBlock: 0,
    paddingInline: 8,
  },
  buttonSmCircle: {
    paddingInline: 0,
    width: 28,
  },
  buttonMd: {
    fontSize: 13,
    height: 36,
    paddingBlock: 0,
    paddingInline: 12,
  },
  buttonMdCircle: {
    paddingInline: 0,
    width: 36,
  },
  buttonLg: {
    fontSize: 14,
    height: 44,
    paddingBlock: 0,
    paddingInline: 18,
  },
  buttonLgCircle: {
    paddingInline: 0,
    width: 44,
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
    minHeight: 28,
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
    height: 28,
    width: 28,
  },
  iconMd: {
    height: 36,
    width: 36,
  },
  iconLg: {
    height: 44,
    width: 44,
  },
  iconRound: {
    borderRadius: radius.pill,
  },
  iconCircle: {
    borderRadius: "50%",
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
  link: styles.link,
  danger: styles.danger,
  "danger-subtle": styles.dangerSubtle,
} as const

const buttonSizeStyles = {
  sm: styles.buttonSm,
  md: styles.buttonMd,
  lg: styles.buttonLg,
} as const

const buttonShapeStyles: Record<Exclude<ButtonShape, "default">, typeof styles.buttonRound> = {
  round: styles.buttonRound,
  circle: styles.buttonCircle,
}

const buttonSizeCircleStyles = {
  sm: styles.buttonSmCircle,
  md: styles.buttonMdCircle,
  lg: styles.buttonLgCircle,
} as const

const iconButtonSizeStyles = {
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
      buttonSizeStyles[props.size ?? "md"],
      shape !== "default" && buttonShapeStyles[shape],
      shape === "circle" && buttonSizeCircleStyles[props.size ?? "md"],
      disabledStyle,
      variant === "link" && styles.linkLayout,
      props.fullWidth && styles.buttonFullWidth,
      props.xstyle,
    )

  return <HeadlessButton {...props} {...attrs()} />
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
