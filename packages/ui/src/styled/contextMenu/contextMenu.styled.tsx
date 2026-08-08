import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color } from "@tabora/theme/tokens.stylex"
import { ContextMenu as Primitive } from "../../primitives/contextMenu/contextMenu"
import type { ContextMenuItem, ContextMenuProps } from "../../primitives/contextMenu/contextMenu"
import { joinClassNames } from "../../stylex"
import { sharedStyles } from "../sharedStyles.stylex"

const styles = stylex.create({
  trigger: {
    display: "inline-flex",
    flexDirection: "column",
    gap: 6,
  },
  content: {},
  item: {
    textAlign: "left",
  },
  danger: {},
  icon: {
    alignItems: "center",
    color: color.textMuted,
    display: "inline-flex",
    justifyContent: "center",
    width: 16,
  },
  label: {},
  trailing: {
    color: color.textMuted,
    fontSize: 11,
    fontWeight: 500,
    marginLeft: "auto",
  },
  kbd: {
    color: color.textSubtle,
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: 10,
    marginLeft: "auto",
  },
  separator: {},
})

export type StyledContextMenuProps = ContextMenuProps & {
  xstyle?: StyleXStyles
}

export function ContextMenu(props: StyledContextMenuProps) {
  const triggerCompiled = () => stylex.attrs(styles.trigger, props.xstyle)
  const contentCompiled = () => stylex.attrs(sharedStyles.menuContent, styles.content)
  const itemCompiled = () => stylex.attrs(sharedStyles.menuItem, styles.item)
  const dangerCompiled = () => stylex.attrs(sharedStyles.menuDanger, styles.danger)
  const iconCompiled = () => stylex.attrs(styles.icon)
  const labelCompiled = () => stylex.attrs(sharedStyles.menuLabel, styles.label)
  const trailingCompiled = () => stylex.attrs(styles.trailing)
  const kbdCompiled = () => stylex.attrs(styles.kbd)
  const separatorCompiled = () => stylex.attrs(sharedStyles.menuSeparator, styles.separator)

  return (
    <Primitive
      {...props}
      class={joinClassNames(triggerCompiled().class, props.class)}
      style={props.style}
      contentClass={joinClassNames(contentCompiled().class, props.contentClass)}
      contentStyle={props.contentStyle}
      itemClass={joinClassNames(itemCompiled().class, props.itemClass)}
      itemStyle={props.itemStyle}
      itemDangerClass={joinClassNames(dangerCompiled().class, props.itemDangerClass)}
      itemDangerStyle={{ ...props.itemDangerStyle }}
      iconClass={joinClassNames(iconCompiled().class, props.iconClass)}
      iconStyle={props.iconStyle}
      labelClass={joinClassNames(labelCompiled().class, props.labelClass)}
      labelStyle={props.labelStyle}
      trailingClass={joinClassNames(trailingCompiled().class, props.trailingClass)}
      trailingStyle={props.trailingStyle}
      kbdClass={joinClassNames(kbdCompiled().class, props.kbdClass)}
      kbdStyle={props.kbdStyle}
      separatorClass={joinClassNames(separatorCompiled().class, props.separatorClass)}
      separatorStyle={{ ...props.separatorStyle }}
    />
  )
}

export type { ContextMenuItem, StyledContextMenuProps as ContextMenuProps }
