import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, font, motion, radius, shadow } from "@tabora/theme/tokens.stylex"
import { Tabs as Primitive } from "../../primitives/tabs/tabs"
import type { TabsProps } from "../../primitives/tabs/tabs"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    display: "grid",
    gap: 12,
    minWidth: 0,
    width: "100%",
  },
  underlineList: {
    alignItems: "center",
    borderBottomColor: color.line,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "flex",
    minWidth: 0,
    overflowX: "auto",
    position: "relative",
  },
  pillsList: {
    alignItems: "center",
    backgroundColor: color.surfaceSoft,
    borderRadius: radius.control,
    display: "flex",
    gap: 4,
    maxWidth: "100%",
    minWidth: 0,
    overflowX: "auto",
    padding: 4,
    position: "relative",
    width: "fit-content",
  },
  trigger: {
    alignItems: "center",
    cursor: "pointer",
    display: "inline-flex",
    flex: "0 0 auto",
    fontFamily: "inherit",
    gap: 6,
    justifyContent: "center",
    lineHeight: 1,
    transitionDuration: motion.fast,
    transitionProperty: "background-color, border-color, color, box-shadow",
    transitionTimingFunction: motion.ease,
    whiteSpace: "nowrap",
    ":hover": {
      color: color.text,
    },
    ":focus-visible": {
      outline: `2px solid ${color.focus}`,
      outlineOffset: 2,
    },
    ":disabled": {
      cursor: "not-allowed",
      opacity: 0.4,
    },
    "[data-selected]": {
      color: color.accent,
      fontWeight: font.semibold,
    },
  },
  underlineTrigger: {
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderBottomColor: "transparent",
    borderBottomStyle: "solid",
    borderBottomWidth: 2,
    color: color.textMuted,
    fontSize: 13,
    fontWeight: font.semibold,
    marginBottom: -1,
    minHeight: 34,
    paddingBlock: 8,
    paddingInline: 14,
  },
  pillsTrigger: {
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: radius.control,
    color: color.textMuted,
    fontSize: 12,
    fontWeight: font.medium,
    minHeight: 30,
    paddingBlock: 5,
    paddingInline: 12,
    "[data-selected]": {
      backgroundColor: color.surface,
      boxShadow: shadow.sm,
    },
  },
  smTrigger: {
    fontSize: 12,
    paddingBlock: 4,
    paddingInline: 10,
  },
  indicator: {
    backgroundColor: color.accent,
    borderTopLeftRadius: radius.r1,
    borderTopRightRadius: radius.r1,
    bottom: -1,
    height: 2,
    left: 0,
    position: "absolute",
    transitionDuration: motion.normal,
    transitionProperty: "left, width",
    transitionTimingFunction: motion.ease,
  },
  indicatorHidden: {
    display: "none",
  },
  content: {
    color: color.textMuted,
    fontSize: 13,
    lineHeight: 1.62,
    minWidth: 0,
  },
})

export type StyledTabsProps = TabsProps & {
  xstyle?: StyleXStyles
}

export function Tabs(props: StyledTabsProps) {
  const rootCompiled = () => stylex.attrs(styles.root, props.xstyle)
  const listCompiled = () =>
    stylex.attrs(
      (!props.variant || props.variant === "underline") && styles.underlineList,
      props.variant === "pills" && styles.pillsList,
    )
  const triggerCompiled = () =>
    stylex.attrs(
      styles.trigger,
      (!props.variant || props.variant === "underline") && styles.underlineTrigger,
      props.variant === "pills" && styles.pillsTrigger,
      props.size === "sm" && styles.smTrigger,
    )
  const indicatorCompiled = () =>
    stylex.attrs(styles.indicator, props.variant === "pills" && styles.indicatorHidden)
  const contentCompiled = () => stylex.attrs(styles.content)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().class, props.class)}
      style={props.style}
      listClass={joinClassNames(listCompiled().class, props.listClass)}
      listStyle={props.listStyle}
      triggerClass={joinClassNames(triggerCompiled().class, props.triggerClass)}
      triggerStyle={props.triggerStyle}
      triggerSelectedStyle={{ ...props.triggerSelectedStyle }}
      indicatorClass={joinClassNames(indicatorCompiled().class, props.indicatorClass)}
      indicatorStyle={{ ...props.indicatorStyle }}
      contentClass={joinClassNames(contentCompiled().class, props.contentClass)}
      contentStyle={props.contentStyle}
    />
  )
}

export type { StyledTabsProps as TabsProps }
