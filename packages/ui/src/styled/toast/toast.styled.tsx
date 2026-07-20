import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Toast as Primitive } from "../../primitives/toast/toast"
import type { ToastProps, ToastVariant } from "../../primitives/toast/toast"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow:
      "0 4px 16px rgb(var(--tbr-color-shadow) / 0.08), 0 0 1px rgb(var(--tbr-color-shadow) / 0.06)",
    color: "rgb(var(--tbr-color-text))",
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
    color: "rgb(var(--tbr-color-info))",
  },
  iconSuccess: {
    color: "rgb(var(--tbr-color-success))",
  },
  iconWarning: {
    color: "rgb(var(--tbr-color-warning))",
  },
  iconDanger: {
    color: "rgb(var(--tbr-color-danger))",
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
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 11,
  },
  action: {
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    color: "rgb(var(--tbr-color-accent))",
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
  const rootCompiled = () => stylex.props(styles.root, props.xstyle)
  const iconCompiled = () =>
    stylex.props(
      styles.icon,
      (!props.variant || props.variant === "info") && styles.iconInfo,
      props.variant === "success" && styles.iconSuccess,
      props.variant === "warning" && styles.iconWarning,
      props.variant === "danger" && styles.iconDanger,
    )
  const bodyCompiled = () => stylex.props(styles.body)
  const titleCompiled = () => stylex.props(styles.title)
  const descriptionCompiled = () => stylex.props(styles.description)
  const actionCompiled = () => stylex.props(styles.action)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
      iconClass={joinClassNames(iconCompiled().className, props.iconClass)}
      iconStyle={mergeSolidStyles(toSolidStyle(iconCompiled().style), props.iconStyle)}
      bodyClass={joinClassNames(bodyCompiled().className, props.bodyClass)}
      bodyStyle={mergeSolidStyles(toSolidStyle(bodyCompiled().style), props.bodyStyle)}
      titleClass={joinClassNames(titleCompiled().className, props.titleClass)}
      titleStyle={mergeSolidStyles(toSolidStyle(titleCompiled().style), props.titleStyle)}
      descriptionClass={joinClassNames(descriptionCompiled().className, props.descriptionClass)}
      descriptionStyle={mergeSolidStyles(
        toSolidStyle(descriptionCompiled().style),
        props.descriptionStyle,
      )}
      actionClass={joinClassNames(actionCompiled().className, props.actionClass)}
      actionStyle={mergeSolidStyles(toSolidStyle(actionCompiled().style), props.actionStyle)}
    />
  )
}

export type { StyledToastProps as ToastProps, ToastVariant }
