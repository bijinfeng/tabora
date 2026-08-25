import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, radius, zIndex } from "@tabora/theme/tokens.stylex"
import { DropdownMenu as P } from "../../primitives/dropdownMenu/dropdownMenu"
import type {
  DropdownMenuAlign,
  DropdownMenuItem,
  DropdownMenuProps,
  DropdownMenuSide,
  DropdownMenuTriggerRenderProps,
} from "../../primitives/dropdownMenu/dropdownMenu"
import { joinClassNames } from "../../stylex"
import { sharedStyles } from "../sharedStyles.stylex"

const styles = stylex.create({
  content: {
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
  item: {},
  danger: {},
  separator: {},
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
  label: {},
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
  const contentCompiled = () =>
    stylex.attrs(sharedStyles.menuContent, sharedStyles.scaleIn, styles.content, props.xstyle)
  const titleCompiled = () => stylex.attrs(styles.title)
  const arrowCompiled = () => stylex.attrs(styles.arrow)
  const itemCompiled = () => stylex.attrs(sharedStyles.menuItem, styles.item)
  const dangerCompiled = () => stylex.attrs(sharedStyles.menuDanger, styles.danger)
  const separatorCompiled = () => stylex.attrs(sharedStyles.menuSeparator, styles.separator)
  const iconCompiled = () => stylex.attrs(styles.icon)
  const checkCompiled = () => stylex.attrs(styles.check)
  const labelCompiled = () => stylex.attrs(sharedStyles.menuLabel, styles.label)
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
  DropdownMenuTriggerRenderProps,
}
