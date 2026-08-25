import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, radius, shadow, zIndex } from "@tabora/theme/tokens.stylex"
import { Popover as P } from "../../primitives/popover/popover"
import type { PopoverProps, PopoverTriggerRenderProps } from "../../primitives/popover/popover"
import { joinClassNames } from "../../stylex"
import { sharedStyles } from "../sharedStyles.stylex"

const styles = stylex.create({
  content: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.panel,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: shadow.floating,
    minWidth: 200,
    outline: "none",
    padding: 12,
    zIndex: zIndex.dropdown,
  },
  arrow: {
    zIndex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: 650,
    marginBottom: 5,
  },
  body: {
    color: color.textMuted,
    fontSize: 11,
    lineHeight: 1.4,
  },
})

export type StyledPopoverProps = PopoverProps & {
  xstyle?: StyleXStyles
}

export function Popover(props: StyledPopoverProps) {
  const contentCompiled = () => stylex.attrs(styles.content, sharedStyles.scaleIn, props.xstyle)
  const arrowCompiled = () => stylex.attrs(styles.arrow)
  const titleCompiled = () => stylex.attrs(styles.title)
  const bodyCompiled = () => stylex.attrs(styles.body)

  return (
    <P
      {...props}
      class={joinClassNames(contentCompiled().class, props.class)}
      style={props.style}
      arrowClass={joinClassNames(arrowCompiled().class, props.arrowClass)}
      arrowStyle={props.arrowStyle}
      titleClass={joinClassNames(titleCompiled().class, props.titleClass)}
      titleStyle={props.titleStyle}
      bodyClass={joinClassNames(bodyCompiled().class, props.bodyClass)}
      bodyStyle={props.bodyStyle}
    />
  )
}

export type { StyledPopoverProps as PopoverProps, PopoverTriggerRenderProps }
