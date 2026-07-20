import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Badge as BadgePrimitive } from "../../primitives/badge/badge"
import type { BadgeProps } from "../../primitives/badge/badge"

const styles = stylex.create({
  root: {
    alignItems: "center",
    borderRadius: 999,
    display: "inline-flex",
    fontWeight: 600,
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
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(var(--tbr-color-text-muted))",
  },
  accent: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    color: "rgb(var(--tbr-color-accent))",
  },
  success: {
    backgroundColor: "rgb(var(--tbr-color-success) / 0.1)",
    color: "rgb(var(--tbr-color-success))",
  },
  warning: {
    backgroundColor: "rgb(var(--tbr-color-warning) / 0.1)",
    color: "rgb(var(--tbr-color-warning))",
  },
  danger: {
    backgroundColor: "rgb(var(--tbr-color-danger) / 0.1)",
    color: "rgb(var(--tbr-color-danger))",
  },
  counter: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    color: "rgb(var(--tbr-color-accent))",
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
    backgroundColor: "rgb(var(--tbr-color-line-strong))",
  },
  dotAccent: {
    backgroundColor: "rgb(var(--tbr-color-accent))",
  },
  dotSuccess: {
    backgroundColor: "rgb(var(--tbr-color-success))",
  },
  dotWarning: {
    backgroundColor: "rgb(var(--tbr-color-warning))",
  },
  dotDanger: {
    backgroundColor: "rgb(var(--tbr-color-danger))",
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
