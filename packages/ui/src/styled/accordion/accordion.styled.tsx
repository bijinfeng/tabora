import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Accordion as P } from "../../primitives/accordion/accordion"
import type { AccordionItem, AccordionProps } from "../../primitives/accordion/accordion"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

const styles = stylex.create({
  root: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-card)",
    borderStyle: "solid",
    borderWidth: 1,
    overflow: "hidden",
  },
  item: {
    borderBottomColor: "rgb(var(--tbr-color-line))",
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    ":last-child": {
      borderBottomWidth: 0,
    },
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
    fontSize: 13,
    fontWeight: 650,
    justifyContent: "space-between",
    paddingBlock: 9,
    paddingInline: 12,
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "background-color",
    transitionTimingFunction: "var(--tbr-ease)",
    width: "100%",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-accent) / 0.04)",
    },
    ":disabled": {
      cursor: "not-allowed",
      opacity: 0.4,
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
      transform: "rotate(180deg)",
    },
  },
  content: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 12,
    lineHeight: 1.4,
    paddingBlock: 9,
    paddingInline: 12,
  },
})

export type StyledAccordionProps = AccordionProps & {
  xstyle?: StyleXStyles
}

export function Accordion(props: StyledAccordionProps) {
  const rootCompiled = () => stylex.props(styles.root, props.xstyle)
  const itemCompiled = () => stylex.props(styles.item)
  const triggerCompiled = () => stylex.props(styles.trigger)
  const arrowCompiled = () => stylex.props(styles.arrow)
  const contentCompiled = () => stylex.props(styles.content)

  return (
    <P
      {...props}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
      itemClass={joinClassNames(itemCompiled().className, props.itemClass)}
      itemStyle={mergeSolidStyles(toSolidStyle(itemCompiled().style), props.itemStyle)}
      triggerClass={joinClassNames(triggerCompiled().className, props.triggerClass)}
      triggerStyle={mergeSolidStyles(toSolidStyle(triggerCompiled().style), props.triggerStyle)}
      arrowClass={joinClassNames(arrowCompiled().className, props.arrowClass)}
      arrowStyle={mergeSolidStyles(toSolidStyle(arrowCompiled().style), props.arrowStyle)}
      contentClass={joinClassNames(contentCompiled().className, props.contentClass)}
      contentStyle={mergeSolidStyles(toSolidStyle(contentCompiled().style), props.contentStyle)}
    />
  )
}

export type { AccordionItem, StyledAccordionProps as AccordionProps }
