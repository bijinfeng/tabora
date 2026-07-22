import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, motion, radius, shadow, zIndex } from "@tabora/theme/tokens.stylex"
import { Dialog as P } from "../../primitives/dialog/dialog"
import type { DialogProps } from "../../primitives/dialog/dialog"
import { joinClassNames } from "../../stylex"

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
    color: color.danger,
  },
  body: {
    color: color.textMuted,
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
  const overlayCompiled = () => stylex.attrs(styles.overlay, props.xstyle)
  const panelCompiled = () =>
    stylex.attrs(styles.panel, props.destructive && styles.panelDestructive, props.panelXstyle)
  const headerCompiled = () =>
    stylex.attrs(styles.header, props.destructive && styles.headerDestructive)
  const bodyCompiled = () => stylex.attrs(styles.body)
  const footerCompiled = () => stylex.attrs(styles.footer)

  return (
    <P
      {...props}
      overlayClass={joinClassNames(overlayCompiled().class, props.overlayClass, props.class)}
      overlayStyle={{ ...props.overlayStyle, ...props.style }}
      panelClass={joinClassNames(panelCompiled().class, props.panelClass)}
      panelStyle={props.panelStyle}
      headerClass={joinClassNames(headerCompiled().class, props.headerClass)}
      headerStyle={props.headerStyle}
      bodyClass={joinClassNames(bodyCompiled().class, props.bodyClass)}
      bodyStyle={props.bodyStyle}
      footerClass={joinClassNames(footerCompiled().class, props.footerClass)}
      footerStyle={props.footerStyle}
    />
  )
}

export type { StyledDialogProps as DialogProps }
