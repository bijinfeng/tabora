import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"
import type { JSX } from "solid-js"

import { color, motion, radius, shadow, zIndex } from "@tabora/theme/tokens.stylex"
import { Dialog as P } from "../../primitives/dialog/dialog"
import type { DialogProps } from "../../primitives/dialog/dialog"
import { joinClassNames } from "../../stylex"
import { Button } from "../button"
import type { ButtonProps } from "../button"

const fadeIn = stylex.keyframes({
  from: {
    opacity: 0,
  },
  to: {
    opacity: 1,
  },
})

const scaleIn = stylex.keyframes({
  from: {
    transform: "translate(-50%, calc(-50% + 8px)) scale(0.95)",
  },
  to: {
    transform: "translate(-50%, -50%) scale(1)",
  },
})

const styles = stylex.create({
  overlay: {
    alignItems: "center",
    animationDuration: motion.normal,
    animationName: fadeIn,
    animationTimingFunction: motion.ease,
    backdropFilter: "blur(2px)",
    backgroundColor: "rgb(var(--tbr-color-scrim) / 0.2)",
    display: "flex",
    inset: 0,
    justifyContent: "center",
    position: "fixed",
    zIndex: zIndex.modal,
  },
  panel: {
    animationDuration: motion.normal,
    animationName: scaleIn,
    animationTimingFunction: motion.ease,
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.panel,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: shadow.floating,
    display: "flex",
    flexDirection: "column",
    gap: 9,
    left: "50%",
    maxHeight: "80vh",
    overflowY: "auto",
    padding: 14,
    position: "fixed",
    top: "50%",
    transform: "translate(-50%, -50%)",
    zIndex: zIndex.modal,
  },
  panelDestructive: {
    borderColor: "rgb(var(--tbr-color-danger) / 0.3)",
  },
  header: {
    alignItems: "center",
    display: "flex",
    fontSize: 13,
    fontWeight: 650,
    gap: 8,
    justifyContent: "space-between",
    lineHeight: 1.4,
  },
  headerDestructive: {
    color: color.danger,
  },
  body: {
    color: color.textMuted,
    display: "flex",
    flexDirection: "column",
    fontSize: 12,
    gap: 9,
    lineHeight: 1.45,
    margin: 0,
  },
  footer: {
    display: "flex",
    gap: 6,
    justifyContent: "flex-end",
    paddingTop: 1,
  },
  close: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: radius.r2,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.textMuted,
    cursor: "pointer",
    display: "inline-flex",
    height: 28,
    justifyContent: "center",
    width: 28,
    ":hover": {
      backgroundColor: color.surfaceHover,
      color: color.text,
    },
  },
})

export type DialogButtonProps = Omit<ButtonProps, "children" | "onClick" | "variant" | "loading">

export type StyledDialogProps = DialogProps & {
  xstyle?: StyleXStyles
  panelXstyle?: StyleXStyles
  onOk?: (() => void) | undefined
  okText?: JSX.Element | undefined
  cancelText?: JSX.Element | undefined
  confirmLoading?: boolean | undefined
  okButtonProps?: DialogButtonProps | undefined
  cancelButtonProps?: DialogButtonProps | undefined
}

export function Dialog(props: StyledDialogProps) {
  const overlayCompiled = () => stylex.attrs(styles.overlay, props.xstyle)
  const panelCompiled = () =>
    stylex.attrs(styles.panel, props.destructive && styles.panelDestructive, props.panelXstyle)
  const headerCompiled = () =>
    stylex.attrs(styles.header, props.destructive && styles.headerDestructive)
  const bodyCompiled = () => stylex.attrs(styles.body)
  const footerCompiled = () => stylex.attrs(styles.footer)
  const closeCompiled = () => stylex.attrs(styles.close)
  const footer = (): JSX.Element | null | undefined => {
    if (props.footer !== undefined) return props.footer
    if (!props.onOk) return undefined
    return (
      <>
        <Button
          {...props.cancelButtonProps}
          variant="secondary"
          size={props.cancelButtonProps?.size ?? "sm"}
          onClick={props.onCancel}
        >
          {props.cancelText ?? "取消"}
        </Button>
        <Button
          {...props.okButtonProps}
          variant={props.destructive ? "danger" : "primary"}
          size={props.okButtonProps?.size ?? "sm"}
          loading={props.confirmLoading ?? false}
          onClick={props.onOk}
        >
          {props.okText ?? "确定"}
        </Button>
      </>
    )
  }

  return (
    <P
      {...props}
      overlayClass={joinClassNames(overlayCompiled().class, props.overlayClass, props.class)}
      overlayStyle={{ ...props.overlayStyle, ...props.style }}
      panelClass={joinClassNames(panelCompiled().class, props.panelClass)}
      panelStyle={props.panelStyle}
      headerClass={joinClassNames(headerCompiled().class, props.headerClass)}
      headerStyle={props.headerStyle}
      closeClass={joinClassNames(closeCompiled().class, props.closeClass)}
      closeStyle={props.closeStyle}
      bodyClass={joinClassNames(bodyCompiled().class, props.bodyClass)}
      bodyStyle={props.bodyStyle}
      footerClass={joinClassNames(footerCompiled().class, props.footerClass)}
      footerStyle={props.footerStyle}
      footer={footer()}
    />
  )
}

export type { StyledDialogProps as DialogProps }
