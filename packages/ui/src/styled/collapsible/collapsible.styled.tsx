import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Collapsible as P } from "../../primitives/collapsible/collapsible"
import type { CollapsibleProps } from "../../primitives/collapsible/collapsible"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

const styles = stylex.create({
  root: {
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    borderStyle: "solid",
    borderWidth: 1,
    overflow: "hidden",
  },
  trigger: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    color: "rgb(var(--tbr-color-text))",
    cursor: "pointer",
    display: "flex",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 600,
    justifyContent: "space-between",
    paddingBlock: 8,
    paddingInline: 12,
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "background-color",
    transitionTimingFunction: "var(--tbr-ease)",
    width: "100%",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-accent) / 0.04)",
    },
  },
  arrow: {
    alignItems: "center",
    color: "rgb(var(--tbr-color-text-muted))",
    display: "inline-flex",
    height: 16,
    justifyContent: "center",
    transitionDuration: "var(--tbr-dur-normal)",
    transitionProperty: "transform",
    transitionTimingFunction: "var(--tbr-ease)",
    width: 16,
    [stylex.when.ancestor("[data-expanded]")]: {
      transform: "rotate(90deg)",
    },
  },
  content: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 12,
    lineHeight: 1.4,
    paddingBottom: 10,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 0,
  },
})

export type StyledCollapsibleProps = CollapsibleProps & {
  xstyle?: StyleXStyles
}

export function Collapsible(props: StyledCollapsibleProps) {
  const rootCompiled = () => stylex.props(styles.root, props.xstyle)
  const triggerCompiled = () => stylex.props(styles.trigger)
  const arrowCompiled = () => stylex.props(styles.arrow)
  const contentCompiled = () => stylex.props(styles.content)

  return (
    <P
      {...props}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
      triggerClass={joinClassNames(triggerCompiled().className, props.triggerClass)}
      triggerStyle={mergeSolidStyles(toSolidStyle(triggerCompiled().style), props.triggerStyle)}
      arrowClass={joinClassNames(arrowCompiled().className, props.arrowClass)}
      arrowStyle={mergeSolidStyles(toSolidStyle(arrowCompiled().style), props.arrowStyle)}
      contentClass={joinClassNames(contentCompiled().className, props.contentClass)}
      contentStyle={mergeSolidStyles(toSolidStyle(contentCompiled().style), props.contentStyle)}
    />
  )
}

export type { StyledCollapsibleProps as CollapsibleProps }
