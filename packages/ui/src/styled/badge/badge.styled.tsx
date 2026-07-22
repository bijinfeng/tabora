import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, font, radius } from "@tabora/theme/tokens.stylex"
import { Badge as BadgePrimitive } from "../../primitives/badge/badge"
import type { BadgeProps } from "../../primitives/badge/badge"

const styles = stylex.create({
  root: {
    alignItems: "center",
    borderRadius: radius.pill,
    display: "inline-flex",
    fontWeight: font.semibold,
    whiteSpace: "nowrap",
  },
  md: {
    fontSize: 11,
    height: 22,
    paddingBlock: 0,
    paddingInline: 8,
  },
  sm: {
    fontSize: 10,
    height: 18,
    paddingBlock: 0,
    paddingInline: 6,
  },
  neutral: {
    backgroundColor: color.surfaceSoft,
    borderColor: color.line,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.textMuted,
  },
  accent: {
    backgroundColor: color.accentSoft,
    color: color.accent,
  },
  success: {
    backgroundColor: "rgb(var(--tbr-color-success) / 0.1)",
    color: color.success,
  },
  warning: {
    backgroundColor: "rgb(var(--tbr-color-warning) / 0.1)",
    color: color.warning,
  },
  danger: {
    backgroundColor: "rgb(var(--tbr-color-danger) / 0.1)",
    color: color.danger,
  },
  counter: {
    backgroundColor: color.accentSoft,
    color: color.accent,
    fontVariantNumeric: "tabular-nums",
    minWidth: "auto",
  },
  counterMd: {
    height: 20,
    paddingBlock: 0,
    paddingInline: 6,
  },
  counterSm: {
    height: 16,
    minWidth: 14,
    paddingBlock: 0,
    paddingInline: 4,
  },
  dot: {
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: "50%",
    height: 8,
    padding: 0,
    width: 8,
  },
  dotNeutral: {
    backgroundColor: color.lineStrong,
  },
  dotAccent: {
    backgroundColor: color.accent,
  },
  dotSuccess: {
    backgroundColor: color.success,
  },
  dotWarning: {
    backgroundColor: color.warning,
  },
  dotDanger: {
    backgroundColor: color.danger,
  },
})

export type StyledBadgeProps = Omit<BadgeProps, "attrs" | "class" | "style"> & {
  xstyle?: StyleXStyles
}

export function Badge(props: StyledBadgeProps) {
  const attrs = () =>
    stylex.attrs(
      styles.root,
      (!props.size || props.size === "md") && props.variant !== "dot" && styles.md,
      props.size === "sm" && props.variant !== "dot" && styles.sm,
      (!props.variant || props.variant === "neutral") && styles.neutral,
      props.variant === "accent" && styles.accent,
      props.variant === "success" && styles.success,
      props.variant === "warning" && styles.warning,
      props.variant === "danger" && styles.danger,
      props.variant === "counter" && styles.counter,
      props.variant === "counter" && (!props.size || props.size === "md") && styles.counterMd,
      props.variant === "counter" && props.size === "sm" && styles.counterSm,
      props.variant === "dot" && styles.dot,
      props.variant === "dot" &&
        (!props.dotColor || props.dotColor === "accent") &&
        styles.dotAccent,
      props.variant === "dot" && props.dotColor === "neutral" && styles.dotNeutral,
      props.variant === "dot" && props.dotColor === "success" && styles.dotSuccess,
      props.variant === "dot" && props.dotColor === "warning" && styles.dotWarning,
      props.variant === "dot" && props.dotColor === "danger" && styles.dotDanger,
      props.xstyle,
    )

  return <BadgePrimitive {...props} attrs={attrs()} />
}

export type { StyledBadgeProps as BadgeProps }
export type { BadgeVariant, BadgeColorVariant } from "../../primitives/badge/badge"
