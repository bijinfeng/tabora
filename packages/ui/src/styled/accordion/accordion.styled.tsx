import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, motion, radius } from "@tabora/theme/tokens.stylex"
import { Accordion as P } from "../../primitives/accordion/accordion"
import type { AccordionItem, AccordionProps } from "../../primitives/accordion/accordion"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    overflow: "hidden",
    width: 320,
  },
  item: {
    borderBottomColor: color.line,
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
    color: color.text,
    cursor: "pointer",
    display: "flex",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 650,
    justifyContent: "space-between",
    paddingBlock: 9,
    paddingInline: 12,
    transitionDuration: motion.fast,
    transitionProperty: "background-color",
    transitionTimingFunction: motion.ease,
    width: "100%",
    ":hover": {
      backgroundColor: color.surfaceHover,
    },
    ":disabled": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
  arrow: {
    alignItems: "center",
    color: color.textMuted,
    display: "inline-flex",
    height: 16,
    justifyContent: "center",
    transitionDuration: motion.normal,
    transitionProperty: "transform",
    transitionTimingFunction: motion.ease,
    width: 16,
  },
  content: {
    color: color.textMuted,
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
  const rootCompiled = () => stylex.attrs(styles.root, props.xstyle)
  const itemCompiled = () => stylex.attrs(styles.item)
  const triggerCompiled = () => stylex.attrs(styles.trigger)
  const arrowCompiled = () => stylex.attrs(styles.arrow)
  const contentCompiled = () => stylex.attrs(styles.content)

  return (
    <P
      {...props}
      class={joinClassNames(rootCompiled().class, props.class)}
      style={props.style}
      itemClass={joinClassNames(itemCompiled().class, props.itemClass)}
      itemStyle={props.itemStyle}
      triggerClass={joinClassNames(triggerCompiled().class, props.triggerClass)}
      triggerStyle={props.triggerStyle}
      arrowClass={joinClassNames(arrowCompiled().class, props.arrowClass)}
      arrowStyle={props.arrowStyle}
      contentClass={joinClassNames(contentCompiled().class, props.contentClass)}
      contentStyle={props.contentStyle}
    />
  )
}

export type { AccordionItem, StyledAccordionProps as AccordionProps }
