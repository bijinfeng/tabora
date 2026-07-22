import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, radius, shadow } from "@tabora/theme/tokens.stylex"
import { Toast as Primitive } from "../../primitives/toast/toast"
import type { ToastProps, ToastVariant } from "../../primitives/toast/toast"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: shadow.floating,
    color: color.text,
    display: "inline-flex",
    fontSize: 12,
    gap: 6,
    maxWidth: 360,
    paddingBlock: 8,
    paddingInline: 10,
  },
  icon: {
    alignItems: "center",
    display: "inline-flex",
    flex: "none",
    height: 14,
    justifyContent: "center",
    width: 14,
  },
  iconInfo: {
    color: color.info,
  },
  iconSuccess: {
    color: color.success,
  },
  iconWarning: {
    color: color.warning,
  },
  iconDanger: {
    color: color.danger,
  },
  body: {
    display: "grid",
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: 12,
    fontWeight: 600,
  },
  description: {
    color: color.textMuted,
    fontSize: 11,
  },
  action: {
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    color: color.accent,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 650,
    marginLeft: "auto",
  },
})

export type StyledToastProps = ToastProps & {
  xstyle?: StyleXStyles
}

export function Toast(props: StyledToastProps) {
  const rootCompiled = () => stylex.attrs(styles.root, props.xstyle)
  const iconCompiled = () =>
    stylex.attrs(
      styles.icon,
      (!props.variant || props.variant === "info") && styles.iconInfo,
      props.variant === "success" && styles.iconSuccess,
      props.variant === "warning" && styles.iconWarning,
      props.variant === "danger" && styles.iconDanger,
    )
  const bodyCompiled = () => stylex.attrs(styles.body)
  const titleCompiled = () => stylex.attrs(styles.title)
  const descriptionCompiled = () => stylex.attrs(styles.description)
  const actionCompiled = () => stylex.attrs(styles.action)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().class, props.class)}
      style={props.style}
      iconClass={joinClassNames(iconCompiled().class, props.iconClass)}
      iconStyle={props.iconStyle}
      bodyClass={joinClassNames(bodyCompiled().class, props.bodyClass)}
      bodyStyle={props.bodyStyle}
      titleClass={joinClassNames(titleCompiled().class, props.titleClass)}
      titleStyle={props.titleStyle}
      descriptionClass={joinClassNames(descriptionCompiled().class, props.descriptionClass)}
      descriptionStyle={{ ...props.descriptionStyle }}
      actionClass={joinClassNames(actionCompiled().class, props.actionClass)}
      actionStyle={props.actionStyle}
    />
  )
}

export type { StyledToastProps as ToastProps, ToastVariant }
