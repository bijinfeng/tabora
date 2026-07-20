import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

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
