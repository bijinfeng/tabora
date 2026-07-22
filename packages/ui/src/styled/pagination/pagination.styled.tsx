import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, font, motion, radius } from "@tabora/theme/tokens.stylex"
import { Pagination as P } from "../../primitives/pagination/pagination"
import type { PaginationProps } from "../../primitives/pagination/pagination"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    display: "inline-flex",
    gap: 2,
  },
  button: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.r2,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.textMuted,
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    fontSize: 13,
    height: 32,
    justifyContent: "center",
    minWidth: 32,
    paddingBlock: 0,
    paddingInline: 6,
    transitionDuration: motion.fast,
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: motion.ease,
    ":hover": {
      backgroundColor: color.surfaceHover,
      borderColor: color.lineStrong,
    },
    ":disabled": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
    "[data-current]": {
      backgroundColor: color.accentSoft,
      borderColor: color.accent,
      color: color.accent,
      fontWeight: font.semibold,
    },
  },
  ellipsis: {
    alignItems: "center",
    color: color.textSubtle,
    display: "flex",
    fontSize: 13,
    height: 32,
    justifyContent: "center",
    minWidth: 32,
  },
})

export type StyledPaginationProps = PaginationProps & {
  xstyle?: StyleXStyles
}

export function Pagination(props: StyledPaginationProps) {
  const rootCompiled = () => stylex.attrs(styles.root, props.xstyle)
  const buttonCompiled = () => stylex.attrs(styles.button)
  const ellipsisCompiled = () => stylex.attrs(styles.ellipsis)

  return (
    <P
      {...props}
      class={joinClassNames(rootCompiled().class, props.class)}
      style={props.style}
      pageButtonClass={joinClassNames(buttonCompiled().class, props.pageButtonClass)}
      pageButtonStyle={{ ...props.pageButtonStyle }}
      pageButtonActiveStyle={{ ...props.pageButtonActiveStyle }}
      ellipsisClass={joinClassNames(ellipsisCompiled().class, props.ellipsisClass)}
      ellipsisStyle={props.ellipsisStyle}
    />
  )
}
export type { StyledPaginationProps as PaginationProps }
