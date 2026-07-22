import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"
import { splitProps } from "solid-js"

import { color, font, motion, radius } from "@tabora/theme/tokens.stylex"
import { Collapsible as P } from "../../primitives/collapsible/collapsible"
import type { CollapsibleProps } from "../../primitives/collapsible/collapsible"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    overflow: "hidden",
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
    fontSize: 12,
    fontWeight: font.semibold,
    justifyContent: "space-between",
    paddingBlock: 8,
    paddingInline: 12,
    transitionDuration: motion.fast,
    transitionProperty: "background-color",
    transitionTimingFunction: motion.ease,
    width: "100%",
    ":hover": {
      backgroundColor: color.surfaceHover,
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
    [stylex.when.ancestor("[data-expanded]")]: {
      transform: "rotate(90deg)",
    },
  },
  content: {
    color: color.textMuted,
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
  unstyled?: boolean
}

export function Collapsible(props: StyledCollapsibleProps) {
  const [local, primitiveProps] = splitProps(props, ["unstyled", "xstyle"])
  const rootCompiled = () => stylex.attrs(!local.unstyled && styles.root, local.xstyle)
  const triggerCompiled = () => stylex.attrs(styles.trigger)
  const arrowCompiled = () => stylex.attrs(styles.arrow)
  const contentCompiled = () => stylex.attrs(styles.content)

  return (
    <P
      {...primitiveProps}
      class={joinClassNames(rootCompiled().class, primitiveProps.class)}
      style={primitiveProps.style}
      triggerClass={joinClassNames(triggerCompiled().class, primitiveProps.triggerClass)}
      triggerStyle={primitiveProps.triggerStyle}
      arrowClass={joinClassNames(arrowCompiled().class, primitiveProps.arrowClass)}
      arrowStyle={primitiveProps.arrowStyle}
      contentClass={joinClassNames(contentCompiled().class, primitiveProps.contentClass)}
      contentStyle={primitiveProps.contentStyle}
    />
  )
}

export type { StyledCollapsibleProps as CollapsibleProps }
