import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, motion, radius, shadow, zIndex } from "@tabora/theme/tokens.stylex"
import { DropdownMenu as P } from "../../primitives/dropdownMenu/dropdownMenu"
import type {
  DropdownMenuAlign,
  DropdownMenuItem,
  DropdownMenuProps,
  DropdownMenuSide,
} from "../../primitives/dropdownMenu/dropdownMenu"
import { joinClassNames } from "../../stylex"

const scaleIn = stylex.keyframes({
  from: {
    opacity: 0,
    transform: "scale(0.98)",
  },
  to: {
    opacity: 1,
    transform: "scale(1)",
  },
})

const styles = stylex.create({
  content: {
    animationDuration: motion.fast,
    animationName: scaleIn,
    animationTimingFunction: motion.ease,
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: shadow.floating,
    maxWidth: 260,
    minWidth: 180,
    overflow: "hidden",
    padding: 0,
    zIndex: zIndex.dropdown,
  },
  title: {
    color: color.textMuted,
    fontSize: 11,
    fontWeight: 650,
    paddingBottom: 4,
    paddingLeft: 10,
    paddingRight: 10,
    paddingTop: 8,
  },
  arrow: {
    zIndex: 1,
  },
  item: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: 0,
    color: color.text,
    cursor: "pointer",
    display: "flex",
    fontFamily: "inherit",
    fontSize: 12,
    gap: 7,
    paddingBlock: 6,
    paddingInline: 10,
    transitionDuration: motion.fast,
    transitionProperty: "background-color",
    transitionTimingFunction: motion.ease,
    width: "100%",
    ":hover": {
      backgroundColor: color.surfaceHover,
    },
    "[data-highlighted]": {
      backgroundColor: color.surfaceHover,
    },
    "[data-disabled]": {
      backgroundColor: "transparent",
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
  danger: {
    color: color.danger,
    ":hover": {
      backgroundColor: color.dangerSoft,
    },
    "[data-highlighted]": {
      backgroundColor: color.dangerSoft,
    },
  },
  separator: {
    backgroundColor: color.line,
    borderStyle: "none",
    borderWidth: 0,
    color: "inherit",
    height: 1,
    marginBlock: 2,
    marginInline: 0,
  },
  icon: {
    alignItems: "center",
    borderRadius: radius.r2,
    color: color.textMuted,
    display: "flex",
    flex: "none",
    fontSize: 9,
    fontWeight: 650,
    height: 14,
    justifyContent: "center",
    width: 14,
  },
  check: {
    alignItems: "center",
    display: "flex",
    flex: "none",
    height: 14,
    justifyContent: "center",
    width: 14,
    "::before": {
      backgroundColor: color.accent,
      borderRadius: "50%",
      content: '""',
      height: 6,
      width: 6,
    },
  },
  label: {
    flex: 1,
    minWidth: 0,
  },
  kbd: {
    color: color.textSubtle,
    fontFamily: '"SFMono-Regular", Consolas, monospace',
    fontSize: 10,
  },
})

export type StyledDropdownMenuProps = DropdownMenuProps & {
  xstyle?: StyleXStyles
}

export function DropdownMenu(props: StyledDropdownMenuProps) {
  const contentCompiled = () => stylex.attrs(styles.content, props.xstyle)
  const titleCompiled = () => stylex.attrs(styles.title)
  const arrowCompiled = () => stylex.attrs(styles.arrow)
  const itemCompiled = () => stylex.attrs(styles.item)
  const dangerCompiled = () => stylex.attrs(styles.danger)
  const separatorCompiled = () => stylex.attrs(styles.separator)
  const iconCompiled = () => stylex.attrs(styles.icon)
  const checkCompiled = () => stylex.attrs(styles.check)
  const labelCompiled = () => stylex.attrs(styles.label)
  const kbdCompiled = () => stylex.attrs(styles.kbd)

  return (
    <P
      {...props}
      class={joinClassNames(contentCompiled().class, props.class)}
      style={props.style}
      titleClass={joinClassNames(titleCompiled().class, props.titleClass)}
      titleStyle={props.titleStyle}
      arrowClass={joinClassNames(arrowCompiled().class, props.arrowClass)}
      arrowStyle={props.arrowStyle}
      itemClass={joinClassNames(itemCompiled().class, props.itemClass)}
      itemStyle={props.itemStyle}
      itemDangerClass={joinClassNames(dangerCompiled().class, props.itemDangerClass)}
      itemDangerStyle={{ ...props.itemDangerStyle }}
      separatorClass={joinClassNames(separatorCompiled().class, props.separatorClass)}
      separatorStyle={{ ...props.separatorStyle }}
      iconClass={joinClassNames(iconCompiled().class, props.iconClass)}
      iconStyle={props.iconStyle}
      checkClass={joinClassNames(checkCompiled().class, props.checkClass)}
      checkStyle={props.checkStyle}
      labelClass={joinClassNames(labelCompiled().class, props.labelClass)}
      labelStyle={props.labelStyle}
      kbdClass={joinClassNames(kbdCompiled().class, props.kbdClass)}
      kbdStyle={props.kbdStyle}
    />
  )
}

export type {
  DropdownMenuAlign,
  DropdownMenuItem,
  StyledDropdownMenuProps as DropdownMenuProps,
  DropdownMenuSide,
}
