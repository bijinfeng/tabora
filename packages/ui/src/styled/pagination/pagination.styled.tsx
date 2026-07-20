import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Pagination as P } from "../../primitives/pagination/pagination"
import type { PaginationProps } from "../../primitives/pagination/pagination"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    display: "inline-flex",
    gap: 2,
  },
  button: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-2)",
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(var(--tbr-color-text-muted))",
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    fontSize: 13,
    height: 32,
    justifyContent: "center",
    minWidth: 32,
    paddingBlock: 0,
    paddingInline: 6,
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: "var(--tbr-ease)",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-accent) / 0.06)",
      borderColor: "rgb(var(--tbr-color-line-strong))",
    },
    ":disabled": {
      cursor: "not-allowed",
      opacity: 0.35,
    },
  },
  active: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    borderColor: "rgb(var(--tbr-color-accent))",
    color: "rgb(var(--tbr-color-accent))",
    fontWeight: 650,
  },
  ellipsis: {
    alignItems: "center",
    color: "rgb(var(--tbr-color-text-subtle))",
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
  const rootCompiled = () => stylex.props(styles.root, props.xstyle)
  const buttonCompiled = () => stylex.props(styles.button)
  const activeCompiled = () => stylex.props(styles.active)
  const ellipsisCompiled = () => stylex.props(styles.ellipsis)

  return (
    <P
      {...props}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
      pageButtonClass={joinClassNames(buttonCompiled().className, props.pageButtonClass)}
      pageButtonStyle={mergeSolidStyles(
        toSolidStyle(buttonCompiled().style),
        props.pageButtonStyle,
      )}
      pageButtonActiveClass={joinClassNames(
        activeCompiled().className,
        props.pageButtonActiveClass,
      )}
      pageButtonActiveStyle={mergeSolidStyles(
        toSolidStyle(activeCompiled().style),
        props.pageButtonActiveStyle,
      )}
      ellipsisClass={joinClassNames(ellipsisCompiled().className, props.ellipsisClass)}
      ellipsisStyle={mergeSolidStyles(toSolidStyle(ellipsisCompiled().style), props.ellipsisStyle)}
    />
  )
}
export type { StyledPaginationProps as PaginationProps }
