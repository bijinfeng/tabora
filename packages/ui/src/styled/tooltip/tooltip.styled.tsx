import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Tooltip as Primitive } from "../../primitives/tooltip/tooltip"
import type { TooltipPlacement, TooltipProps } from "../../primitives/tooltip/tooltip"
import { joinClassNames } from "../../stylex"

const tooltipIn = stylex.keyframes({
  from: {
    opacity: 0,
    transform: "translateY(2px)",
  },
  to: {
    opacity: 1,
    transform: "translateY(0)",
  },
})

const styles = stylex.create({
  trigger: {
    display: "inline-flex",
  },
  content: {
    animationDuration: "var(--tbr-dur-fast)",
    animationName: tooltipIn,
    animationTimingFunction: "var(--tbr-ease)",
    backgroundColor: "rgb(var(--tbr-color-text))",
    borderRadius: "var(--tbr-radius-2)",
    color: "rgb(var(--tbr-color-surface))",
    fontSize: 11,
    fontWeight: 500,
    paddingBlock: 4,
    paddingInline: 10,
    position: "relative",
    whiteSpace: "nowrap",
    zIndex: 100,
    "::after": {
      backgroundColor: "rgb(var(--tbr-color-text))",
      content: '""',
      height: 6,
      position: "absolute",
      transform: "rotate(45deg)",
      width: 6,
    },
    '[data-placement="top"]::after': {
      bottom: -3,
      left: "50%",
      marginLeft: -3,
    },
    '[data-placement="bottom"]::after': {
      left: "50%",
      marginLeft: -3,
      top: -3,
    },
  },
})

export type StyledTooltipProps = TooltipProps & {
  xstyle?: StyleXStyles
  contentXstyle?: StyleXStyles
}

export function Tooltip(props: StyledTooltipProps) {
  const triggerCompiled = () => stylex.attrs(styles.trigger, props.xstyle)
  const contentCompiled = () => stylex.attrs(styles.content, props.contentXstyle)

  return (
    <Primitive
      {...props}
      triggerClass={joinClassNames(triggerCompiled().class, props.triggerClass)}
      triggerStyle={props.triggerStyle}
      contentClass={joinClassNames(contentCompiled().class, props.contentClass, props.class)}
      contentStyle={props.contentStyle}
    />
  )
}

export type { StyledTooltipProps as TooltipProps, TooltipPlacement }
