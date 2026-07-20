import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { DropdownMenu as P } from "../../primitives/dropdownMenu/dropdownMenu"
import type {
  DropdownMenuAlign,
  DropdownMenuItem,
  DropdownMenuProps,
  DropdownMenuSide,
} from "../../primitives/dropdownMenu/dropdownMenu"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

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
    animationDuration: "120ms",
    animationName: scaleIn,
    animationTimingFunction: "var(--tbr-ease)",
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow:
      "0 4px 16px rgb(var(--tbr-color-shadow) / 0.08), 0 0 1px rgb(var(--tbr-color-shadow) / 0.06)",
    maxWidth: 260,
    minWidth: 180,
    overflow: "hidden",
    padding: 0,
    zIndex: 50,
  },
  title: {
    color: "rgb(var(--tbr-color-text-muted))",
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
    color: "rgb(var(--tbr-color-text))",
    cursor: "pointer",
    display: "flex",
    fontFamily: "inherit",
    fontSize: 12,
    gap: 7,
    paddingBlock: 6,
    paddingInline: 10,
    transitionDuration: "120ms",
    transitionProperty: "background-color",
    transitionTimingFunction: "ease",
    width: "100%",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
    },
    "[data-highlighted]": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
    },
    "[data-disabled]": {
      backgroundColor: "transparent",
      cursor: "not-allowed",
      opacity: 0.4,
    },
  },
  danger: {
    color: "rgb(var(--tbr-color-danger))",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-danger-soft))",
    },
    "[data-highlighted]": {
      backgroundColor: "rgb(var(--tbr-color-danger-soft))",
    },
  },
  separator: {
    backgroundColor: "rgb(var(--tbr-color-line))",
    borderStyle: "none",
    borderWidth: 0,
    color: "inherit",
    height: 1,
    marginBlock: 2,
    marginInline: 0,
  },
  icon: {
    alignItems: "center",
    borderRadius: 4,
    color: "rgb(var(--tbr-color-text-muted))",
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
      backgroundColor: "rgb(var(--tbr-color-accent))",
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
    color: "rgb(var(--tbr-color-text-subtle))",
    fontFamily: '"SFMono-Regular", Consolas, monospace',
    fontSize: 10,
  },
})

export type StyledDropdownMenuProps = DropdownMenuProps & {
  xstyle?: StyleXStyles
}

export function DropdownMenu(props: StyledDropdownMenuProps) {
  const contentCompiled = () => stylex.props(styles.content, props.xstyle)
  const titleCompiled = () => stylex.props(styles.title)
  const arrowCompiled = () => stylex.props(styles.arrow)
  const itemCompiled = () => stylex.props(styles.item)
  const dangerCompiled = () => stylex.props(styles.danger)
  const separatorCompiled = () => stylex.props(styles.separator)
  const iconCompiled = () => stylex.props(styles.icon)
  const checkCompiled = () => stylex.props(styles.check)
  const labelCompiled = () => stylex.props(styles.label)
  const kbdCompiled = () => stylex.props(styles.kbd)

  return (
    <P
      {...props}
      class={joinClassNames(contentCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(contentCompiled().style), props.style)}
      titleClass={joinClassNames(titleCompiled().className, props.titleClass)}
      titleStyle={mergeSolidStyles(toSolidStyle(titleCompiled().style), props.titleStyle)}
      arrowClass={joinClassNames(arrowCompiled().className, props.arrowClass)}
      arrowStyle={mergeSolidStyles(toSolidStyle(arrowCompiled().style), props.arrowStyle)}
      itemClass={joinClassNames(itemCompiled().className, props.itemClass)}
      itemStyle={mergeSolidStyles(toSolidStyle(itemCompiled().style), props.itemStyle)}
      itemDangerClass={joinClassNames(dangerCompiled().className, props.itemDangerClass)}
      itemDangerStyle={mergeSolidStyles(
        toSolidStyle(dangerCompiled().style),
        props.itemDangerStyle,
      )}
      separatorClass={joinClassNames(separatorCompiled().className, props.separatorClass)}
      separatorStyle={mergeSolidStyles(
        toSolidStyle(separatorCompiled().style),
        props.separatorStyle,
      )}
      iconClass={joinClassNames(iconCompiled().className, props.iconClass)}
      iconStyle={mergeSolidStyles(toSolidStyle(iconCompiled().style), props.iconStyle)}
      checkClass={joinClassNames(checkCompiled().className, props.checkClass)}
      checkStyle={mergeSolidStyles(toSolidStyle(checkCompiled().style), props.checkStyle)}
      labelClass={joinClassNames(labelCompiled().className, props.labelClass)}
      labelStyle={mergeSolidStyles(toSolidStyle(labelCompiled().style), props.labelStyle)}
      kbdClass={joinClassNames(kbdCompiled().className, props.kbdClass)}
      kbdStyle={mergeSolidStyles(toSolidStyle(kbdCompiled().style), props.kbdStyle)}
    />
  )
}

export type {
  DropdownMenuAlign,
  DropdownMenuItem,
  StyledDropdownMenuProps as DropdownMenuProps,
  DropdownMenuSide,
}
