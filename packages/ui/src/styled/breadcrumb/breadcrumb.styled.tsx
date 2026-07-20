import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Breadcrumb as P } from "../../primitives/breadcrumb/breadcrumb"
import type { BreadcrumbProps, BreadcrumbItem } from "../../primitives/breadcrumb/breadcrumb"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    display: "flex",
    fontSize: 13,
    gap: 0,
  },
  wrap: {
    alignItems: "center",
    display: "flex",
  },
  separator: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 10,
    marginBlock: 0,
    marginInline: 6,
    userSelect: "none",
  },
  link: {
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: 4,
    color: "rgb(var(--tbr-color-text-muted))",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 13,
    paddingBlock: 2,
    paddingInline: 4,
    textDecoration: "none",
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "background-color, color",
    transitionTimingFunction: "var(--tbr-ease)",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-accent) / 0.04)",
      color: "rgb(var(--tbr-color-text))",
    },
  },
  current: {
    color: "rgb(var(--tbr-color-text))",
    fontWeight: 650,
  },
})

export type StyledBreadcrumbProps = BreadcrumbProps & {
  xstyle?: StyleXStyles
}

export function Breadcrumb(props: StyledBreadcrumbProps) {
  const rootCompiled = () => stylex.props(styles.root, props.xstyle)
  const wrapCompiled = () => stylex.props(styles.wrap)
  const separatorCompiled = () => stylex.props(styles.separator)
  const linkCompiled = () => stylex.props(styles.link)
  const currentCompiled = () => stylex.props(styles.current)

  return (
    <P
      {...props}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
      wrapClass={joinClassNames(wrapCompiled().className, props.wrapClass)}
      wrapStyle={mergeSolidStyles(toSolidStyle(wrapCompiled().style), props.wrapStyle)}
      separatorClass={joinClassNames(separatorCompiled().className, props.separatorClass)}
      separatorStyle={mergeSolidStyles(
        toSolidStyle(separatorCompiled().style),
        props.separatorStyle,
      )}
      linkClass={joinClassNames(linkCompiled().className, props.linkClass)}
      linkStyle={mergeSolidStyles(toSolidStyle(linkCompiled().style), props.linkStyle)}
      currentClass={joinClassNames(currentCompiled().className, props.currentClass)}
      currentStyle={mergeSolidStyles(toSolidStyle(currentCompiled().style), props.currentStyle)}
    />
  )
}
export type { StyledBreadcrumbProps as BreadcrumbProps, BreadcrumbItem }
