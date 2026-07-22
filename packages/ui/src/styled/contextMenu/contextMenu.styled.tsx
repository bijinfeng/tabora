import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, motion, radius, shadow } from "@tabora/theme/tokens.stylex"
import { ContextMenu as Primitive } from "../../primitives/contextMenu/contextMenu"
import type { ContextMenuItem, ContextMenuProps } from "../../primitives/contextMenu/contextMenu"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  trigger: {
    display: "inline-flex",
    flexDirection: "column",
    gap: 6,
  },
  content: {
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
    textAlign: "left",
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
  icon: {
    alignItems: "center",
    color: color.textMuted,
    display: "inline-flex",
    justifyContent: "center",
    width: 16,
  },
  label: {
    flex: 1,
    minWidth: 0,
  },
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
  separator: {
    backgroundColor: color.line,
    borderStyle: "none",
    borderWidth: 0,
    color: "inherit",
    height: 1,
    marginBlock: 2,
    marginInline: 0,
  },
})

export type StyledContextMenuProps = ContextMenuProps & {
  xstyle?: StyleXStyles
}

export function ContextMenu(props: StyledContextMenuProps) {
  const triggerCompiled = () => stylex.attrs(styles.trigger, props.xstyle)
  const contentCompiled = () => stylex.attrs(styles.content)
  const itemCompiled = () => stylex.attrs(styles.item)
  const dangerCompiled = () => stylex.attrs(styles.danger)
  const iconCompiled = () => stylex.attrs(styles.icon)
  const labelCompiled = () => stylex.attrs(styles.label)
  const trailingCompiled = () => stylex.attrs(styles.trailing)
  const kbdCompiled = () => stylex.attrs(styles.kbd)
  const separatorCompiled = () => stylex.attrs(styles.separator)

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
