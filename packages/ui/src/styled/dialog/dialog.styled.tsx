import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Dialog as P } from "../../primitives/dialog/dialog"
import type { DialogProps } from "../../primitives/dialog/dialog"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

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
    transform: "scale(0.95) translateY(8px)",
  },
  to: {
    transform: "scale(1) translateY(0)",
  },
})

const styles = stylex.create({
  overlay: {
    alignItems: "center",
    animationDuration: "var(--tbr-dur-normal)",
    animationName: fadeIn,
    animationTimingFunction: "var(--tbr-ease)",
    backdropFilter: "blur(2px)",
    backgroundColor: "rgb(var(--tbr-color-scrim) / 0.2)",
    display: "flex",
    inset: 0,
    justifyContent: "center",
    position: "fixed",
    zIndex: 300,
  },
  panel: {
    animationDuration: "var(--tbr-dur-normal)",
    animationName: scaleIn,
    animationTimingFunction: "var(--tbr-ease)",
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-panel)",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 8px 32px rgb(var(--tbr-color-shadow) / 0.12)",
    display: "flex",
    flexDirection: "column",
    gap: 9,
    maxHeight: "80vh",
    overflowY: "auto",
    padding: 14,
  },
  panelDestructive: {
    borderColor: "rgb(var(--tbr-color-danger) / 0.3)",
  },
  header: {
    fontSize: 14,
    fontWeight: 650,
    lineHeight: 1.25,
  },
  headerDestructive: {
    color: "rgb(var(--tbr-color-danger))",
  },
  body: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 12,
    lineHeight: 1.45,
  },
  footer: {
    display: "flex",
    gap: 6,
    justifyContent: "flex-end",
    paddingTop: 1,
  },
})

export type StyledDialogProps = DialogProps & {
  xstyle?: StyleXStyles
  panelXstyle?: StyleXStyles
}

export function Dialog(props: StyledDialogProps) {
  const overlayCompiled = () => stylex.props(styles.overlay, props.xstyle)
  const panelCompiled = () =>
    stylex.props(styles.panel, props.destructive && styles.panelDestructive, props.panelXstyle)
  const headerCompiled = () =>
    stylex.props(styles.header, props.destructive && styles.headerDestructive)
  const bodyCompiled = () => stylex.props(styles.body)
  const footerCompiled = () => stylex.props(styles.footer)

  return (
    <P
      {...props}
      overlayClass={joinClassNames(overlayCompiled().className, props.overlayClass, props.class)}
      overlayStyle={mergeSolidStyles(
        toSolidStyle(overlayCompiled().style),
        props.overlayStyle,
        props.style,
      )}
      panelClass={joinClassNames(panelCompiled().className, props.panelClass)}
      panelStyle={mergeSolidStyles(toSolidStyle(panelCompiled().style), props.panelStyle)}
      headerClass={joinClassNames(headerCompiled().className, props.headerClass)}
      headerStyle={mergeSolidStyles(toSolidStyle(headerCompiled().style), props.headerStyle)}
      bodyClass={joinClassNames(bodyCompiled().className, props.bodyClass)}
      bodyStyle={mergeSolidStyles(toSolidStyle(bodyCompiled().style), props.bodyStyle)}
      footerClass={joinClassNames(footerCompiled().className, props.footerClass)}
      footerStyle={mergeSolidStyles(toSolidStyle(footerCompiled().style), props.footerStyle)}
    />
  )
}

export type { StyledDialogProps as DialogProps }
