import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, font, motion, radius } from "@tabora/theme/tokens.stylex"
import { Breadcrumb as P } from "../../primitives/breadcrumb/breadcrumb"
import type { BreadcrumbProps, BreadcrumbItem } from "../../primitives/breadcrumb/breadcrumb"
import { joinClassNames } from "../../stylex"

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
    color: color.textSubtle,
    fontSize: 10,
    marginBlock: 0,
    marginInline: 6,
    userSelect: "none",
  },
  link: {
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: radius.r1,
    color: color.textMuted,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 13,
    paddingBlock: 2,
    paddingInline: 4,
    textDecoration: "none",
    transitionDuration: motion.fast,
    transitionProperty: "background-color, color",
    transitionTimingFunction: motion.ease,
    ":hover": {
      backgroundColor: color.surfaceHover,
      color: color.text,
    },
  },
  current: {
    color: color.text,
    fontWeight: font.semibold,
  },
})

export type StyledBreadcrumbProps = BreadcrumbProps & {
  xstyle?: StyleXStyles
}

export function Breadcrumb(props: StyledBreadcrumbProps) {
  const rootCompiled = () => stylex.attrs(styles.root, props.xstyle)
  const wrapCompiled = () => stylex.attrs(styles.wrap)
  const separatorCompiled = () => stylex.attrs(styles.separator)
  const linkCompiled = () => stylex.attrs(styles.link)
  const currentCompiled = () => stylex.attrs(styles.current)

  return (
    <P
      {...props}
      class={joinClassNames(rootCompiled().class, props.class)}
      style={props.style}
      wrapClass={joinClassNames(wrapCompiled().class, props.wrapClass)}
      wrapStyle={props.wrapStyle}
      separatorClass={joinClassNames(separatorCompiled().class, props.separatorClass)}
      separatorStyle={{ ...props.separatorStyle }}
      linkClass={joinClassNames(linkCompiled().class, props.linkClass)}
      linkStyle={props.linkStyle}
      currentClass={joinClassNames(currentCompiled().class, props.currentClass)}
      currentStyle={props.currentStyle}
    />
  )
}
export type { StyledBreadcrumbProps as BreadcrumbProps, BreadcrumbItem }
