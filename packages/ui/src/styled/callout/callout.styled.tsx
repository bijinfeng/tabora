import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, font, radius } from "@tabora/theme/tokens.stylex"
import {
  Alert as PrimitiveAlert,
  Banner as PrimitiveBanner,
} from "../../primitives/callout/callout"
import type { AlertProps, BannerProps, CalloutVariant } from "../../primitives/callout/callout"

const styles = stylex.create({
  root: {
    alignItems: "flex-start",
    borderColor: "currentColor",
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    fontSize: 12,
    gap: 8,
    lineHeight: 1.4,
    paddingBlock: 9,
    paddingInline: 12,
  },
  banner: {
    width: "100%",
  },
  info: {
    backgroundColor: "rgb(var(--tbr-color-info) / 0.08)",
    borderColor: "rgb(var(--tbr-color-info) / 0.2)",
    color: color.info,
  },
  success: {
    backgroundColor: "rgb(var(--tbr-color-success) / 0.08)",
    borderColor: "rgb(var(--tbr-color-success) / 0.2)",
    color: color.success,
  },
  warning: {
    backgroundColor: "rgb(var(--tbr-color-warning) / 0.08)",
    borderColor: "rgb(var(--tbr-color-warning) / 0.2)",
    color: color.warning,
  },
  danger: {
    backgroundColor: "rgb(var(--tbr-color-danger) / 0.08)",
    borderColor: "rgb(var(--tbr-color-danger) / 0.2)",
    color: color.danger,
  },
  icon: {
    alignItems: "center",
    display: "inline-flex",
    flex: "none",
    height: 14,
    justifyContent: "center",
    marginTop: 1,
    width: 14,
  },
  body: {
    display: "grid",
    flex: 1,
    gap: 1,
    minWidth: 0,
  },
  title: {
    fontWeight: font.semibold,
  },
  description: {
    color: color.textMuted,
    fontSize: 11,
    lineHeight: 1.35,
  },
  action: {
    flex: "none",
  },
  close: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: radius.r2,
    color: "currentColor",
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    height: 24,
    justifyContent: "center",
    width: 24,
    ":hover": {
      backgroundColor: color.surfaceHover,
    },
  },
})

type CalloutStyleProps =
  | "attrs"
  | "class"
  | "style"
  | "iconAttrs"
  | "iconClass"
  | "iconStyle"
  | "bodyAttrs"
  | "bodyClass"
  | "bodyStyle"
  | "titleAttrs"
  | "titleClass"
  | "titleStyle"
  | "descriptionAttrs"
  | "descriptionClass"
  | "descriptionStyle"
  | "actionAttrs"
  | "actionClass"
  | "actionStyle"
  | "closeAttrs"
  | "closeClass"
  | "closeStyle"

export type StyledBannerProps = Omit<BannerProps, CalloutStyleProps> & {
  xstyle?: StyleXStyles
}

export type StyledAlertProps = Omit<AlertProps, CalloutStyleProps> & {
  xstyle?: StyleXStyles
}

function partAttrs() {
  const iconAttrs = () => stylex.attrs(styles.icon)
  const bodyAttrs = () => stylex.attrs(styles.body)
  const titleAttrs = () => stylex.attrs(styles.title)
  const descriptionAttrs = () => stylex.attrs(styles.description)
  const actionAttrs = () => stylex.attrs(styles.action)
  const closeAttrs = () => stylex.attrs(styles.close)

  return {
    iconAttrs: iconAttrs(),
    bodyAttrs: bodyAttrs(),
    titleAttrs: titleAttrs(),
    descriptionAttrs: descriptionAttrs(),
    actionAttrs: actionAttrs(),
    closeAttrs: closeAttrs(),
  }
}

export function Banner(props: StyledBannerProps) {
  const rootAttrs = () =>
    stylex.attrs(
      styles.root,
      styles.banner,
      (!props.variant || props.variant === "info") && styles.info,
      props.variant === "success" && styles.success,
      props.variant === "warning" && styles.warning,
      props.variant === "danger" && styles.danger,
      props.xstyle,
    )

  return <PrimitiveBanner {...props} {...partAttrs()} attrs={rootAttrs()} />
}

export function Alert(props: StyledAlertProps) {
  const rootAttrs = () =>
    stylex.attrs(
      styles.root,
      (!props.variant || props.variant === "info") && styles.info,
      props.variant === "success" && styles.success,
      props.variant === "warning" && styles.warning,
      props.variant === "danger" && styles.danger,
      props.xstyle,
    )

  return <PrimitiveAlert {...props} {...partAttrs()} attrs={rootAttrs()} />
}

export type { StyledAlertProps as AlertProps, StyledBannerProps as BannerProps, CalloutVariant }
