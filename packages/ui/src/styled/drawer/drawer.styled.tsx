import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Drawer as Primitive } from "../../primitives/drawer/drawer"
import type { DrawerProps } from "../../primitives/drawer/drawer"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

const styles = stylex.create({
  root: {
    inset: 0,
    pointerEvents: "none",
    position: "fixed",
    zIndex: 70,
  },
  scrim: {
    backgroundColor: "rgb(var(--tbr-color-scrim) / 0.28)",
    borderStyle: "none",
    borderWidth: 0,
    inset: 0,
    pointerEvents: "auto",
    position: "absolute",
  },
  panel: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderStyle: "solid",
    borderWidth: 1,
    bottom: 0,
    boxShadow:
      "0 20px 48px rgb(var(--tbr-color-shadow-strong) / 0.18), 0 0 1px rgb(var(--tbr-color-shadow) / 0.08)",
    display: "flex",
    flexDirection: "column",
    pointerEvents: "auto",
    position: "absolute",
    top: 0,
    width: "min(90vw, 420px)",
  },
  right: {
    borderRadius: "var(--tbr-radius-panel) 0 0 var(--tbr-radius-panel)",
    right: 0,
  },
  left: {
    borderRadius: "0 var(--tbr-radius-panel) var(--tbr-radius-panel) 0",
    left: 0,
  },
  sm: {
    width: "min(90vw, 340px)",
  },
  lg: {
    width: "min(90vw, 560px)",
  },
  header: {
    alignItems: "center",
    borderBottomColor: "rgb(var(--tbr-color-line))",
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "flex",
    gap: 12,
    justifyContent: "space-between",
    paddingBlock: 10,
    paddingInline: 12,
  },
  footer: {
    alignItems: "center",
    borderBottom: "none",
    borderTopColor: "rgb(var(--tbr-color-line))",
    borderTopStyle: "solid",
    borderTopWidth: 1,
    display: "flex",
    gap: 12,
    justifyContent: "flex-end",
    paddingBlock: 9,
    paddingInline: 12,
  },
  title: {
    color: "rgb(var(--tbr-color-text))",
    fontSize: 14,
    fontWeight: 650,
    lineHeight: 1.35,
    margin: 0,
  },
  description: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 12,
    lineHeight: 1.45,
    marginBottom: 0,
    marginLeft: 0,
    marginRight: 0,
    marginTop: 3,
  },
  close: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: "var(--tbr-radius-2)",
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(var(--tbr-color-text-muted))",
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    height: 28,
    justifyContent: "center",
    width: 28,
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
      color: "rgb(var(--tbr-color-text))",
    },
  },
  body: {
    flex: 1,
    minHeight: 0,
    overflow: "auto",
    padding: 12,
  },
})

export type StyledDrawerProps = DrawerProps & {
  xstyle?: StyleXStyles
}

export function Drawer(props: StyledDrawerProps) {
  const rootCompiled = () => stylex.props(styles.root, props.xstyle)
  const scrimCompiled = () => stylex.props(styles.scrim)
  const panelCompiled = () => stylex.props(styles.panel)
  const panelSideCompiled = () =>
    stylex.props(
      (!props.side || props.side === "right") && styles.right,
      props.side === "left" && styles.left,
    )
  const panelSizeCompiled = () =>
    stylex.props(props.size === "sm" && styles.sm, props.size === "lg" && styles.lg)
  const headerCompiled = () => stylex.props(styles.header)
  const titleCompiled = () => stylex.props(styles.title)
  const descriptionCompiled = () => stylex.props(styles.description)
  const closeCompiled = () => stylex.props(styles.close)
  const bodyCompiled = () => stylex.props(styles.body)
  const footerCompiled = () => stylex.props(styles.footer)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
      scrimClass={joinClassNames(scrimCompiled().className, props.scrimClass)}
      scrimStyle={mergeSolidStyles(toSolidStyle(scrimCompiled().style), props.scrimStyle)}
      panelClass={joinClassNames(panelCompiled().className, props.panelClass)}
      panelStyle={mergeSolidStyles(toSolidStyle(panelCompiled().style), props.panelStyle)}
      panelSideClass={joinClassNames(panelSideCompiled().className, props.panelSideClass)}
      panelSideStyle={mergeSolidStyles(
        toSolidStyle(panelSideCompiled().style),
        props.panelSideStyle,
      )}
      panelSizeClass={joinClassNames(panelSizeCompiled().className, props.panelSizeClass)}
      panelSizeStyle={mergeSolidStyles(
        toSolidStyle(panelSizeCompiled().style),
        props.panelSizeStyle,
      )}
      headerClass={joinClassNames(headerCompiled().className, props.headerClass)}
      headerStyle={mergeSolidStyles(toSolidStyle(headerCompiled().style), props.headerStyle)}
      titleClass={joinClassNames(titleCompiled().className, props.titleClass)}
      titleStyle={mergeSolidStyles(toSolidStyle(titleCompiled().style), props.titleStyle)}
      descriptionClass={joinClassNames(descriptionCompiled().className, props.descriptionClass)}
      descriptionStyle={mergeSolidStyles(
        toSolidStyle(descriptionCompiled().style),
        props.descriptionStyle,
      )}
      closeClass={joinClassNames(closeCompiled().className, props.closeClass)}
      closeStyle={mergeSolidStyles(toSolidStyle(closeCompiled().style), props.closeStyle)}
      bodyClass={joinClassNames(bodyCompiled().className, props.bodyClass)}
      bodyStyle={mergeSolidStyles(toSolidStyle(bodyCompiled().style), props.bodyStyle)}
      footerClass={joinClassNames(footerCompiled().className, props.footerClass)}
      footerStyle={mergeSolidStyles(toSolidStyle(footerCompiled().style), props.footerStyle)}
    />
  )
}

export type { StyledDrawerProps as DrawerProps }
