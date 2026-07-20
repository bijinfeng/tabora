import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import {
  Alert as PrimitiveAlert,
  Banner as PrimitiveBanner,
} from "../../primitives/callout/callout"
import type { AlertProps, BannerProps, CalloutVariant } from "../../primitives/callout/callout"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

const styles = stylex.create({
  root: {
    alignItems: "flex-start",
    borderColor: "currentColor",
    borderRadius: "var(--tbr-radius-control)",
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
    color: "rgb(var(--tbr-color-info))",
  },
  success: {
    backgroundColor: "rgb(var(--tbr-color-success) / 0.08)",
    borderColor: "rgb(var(--tbr-color-success) / 0.2)",
    color: "rgb(var(--tbr-color-success))",
  },
  warning: {
    backgroundColor: "rgb(var(--tbr-color-warning) / 0.08)",
    borderColor: "rgb(var(--tbr-color-warning) / 0.2)",
    color: "rgb(var(--tbr-color-warning))",
  },
  danger: {
    backgroundColor: "rgb(var(--tbr-color-danger) / 0.08)",
    borderColor: "rgb(var(--tbr-color-danger) / 0.2)",
    color: "rgb(var(--tbr-color-danger))",
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
    fontWeight: 650,
  },
  description: {
    color: "rgb(var(--tbr-color-text-muted))",
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
    borderRadius: "var(--tbr-radius-2)",
    color: "currentColor",
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    height: 24,
    justifyContent: "center",
    width: 24,
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
    },
  },
})

export type StyledBannerProps = BannerProps & {
  xstyle?: StyleXStyles
}

export type StyledAlertProps = AlertProps & {
  xstyle?: StyleXStyles
}

function partProps(props: BannerProps | AlertProps) {
  const iconCompiled = () => stylex.props(styles.icon)
  const bodyCompiled = () => stylex.props(styles.body)
  const titleCompiled = () => stylex.props(styles.title)
  const descriptionCompiled = () => stylex.props(styles.description)
  const actionCompiled = () => stylex.props(styles.action)
  const closeCompiled = () => stylex.props(styles.close)

  return {
    iconClass: joinClassNames(iconCompiled().className, props.iconClass),
    iconStyle: mergeSolidStyles(toSolidStyle(iconCompiled().style), props.iconStyle),
    bodyClass: joinClassNames(bodyCompiled().className, props.bodyClass),
    bodyStyle: mergeSolidStyles(toSolidStyle(bodyCompiled().style), props.bodyStyle),
    titleClass: joinClassNames(titleCompiled().className, props.titleClass),
    titleStyle: mergeSolidStyles(toSolidStyle(titleCompiled().style), props.titleStyle),
    descriptionClass: joinClassNames(descriptionCompiled().className, props.descriptionClass),
    descriptionStyle: mergeSolidStyles(
      toSolidStyle(descriptionCompiled().style),
      props.descriptionStyle,
    ),
    actionClass: joinClassNames(actionCompiled().className, props.actionClass),
    actionStyle: mergeSolidStyles(toSolidStyle(actionCompiled().style), props.actionStyle),
    closeClass: joinClassNames(closeCompiled().className, props.closeClass),
    closeStyle: mergeSolidStyles(toSolidStyle(closeCompiled().style), props.closeStyle),
  }
}

export function Banner(props: StyledBannerProps) {
  const rootCompiled = () =>
    stylex.props(
      styles.root,
      styles.banner,
      (!props.variant || props.variant === "info") && styles.info,
      props.variant === "success" && styles.success,
      props.variant === "warning" && styles.warning,
      props.variant === "danger" && styles.danger,
      props.xstyle,
    )

  return (
    <PrimitiveBanner
      {...props}
      {...partProps(props)}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
    />
  )
}

export function Alert(props: StyledAlertProps) {
  const rootCompiled = () =>
    stylex.props(
      styles.root,
      (!props.variant || props.variant === "info") && styles.info,
      props.variant === "success" && styles.success,
      props.variant === "warning" && styles.warning,
      props.variant === "danger" && styles.danger,
      props.xstyle,
    )

  return (
    <PrimitiveAlert
      {...props}
      {...partProps(props)}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
    />
  )
}

export type { StyledAlertProps as AlertProps, StyledBannerProps as BannerProps, CalloutVariant }
