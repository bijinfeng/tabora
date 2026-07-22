import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, radius } from "@tabora/theme/tokens.stylex"
import { Menubar as Primitive } from "../../primitives/menubar/menubar"
import type { MenubarItem, MenubarProps } from "../../primitives/menubar/menubar"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    display: "inline-flex",
    gap: 0,
    padding: 2,
  },
  item: {
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: radius.r2,
    color: color.textMuted,
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 500,
    minHeight: 30,
    paddingBlock: 0,
    paddingInline: 12,
    whiteSpace: "nowrap",
    ":hover": {
      backgroundColor: color.surfaceHover,
      color: color.text,
    },
    "[data-pressed]": {
      backgroundColor: color.accentSoft,
      color: color.accent,
      fontWeight: 650,
    },
  },
})

export type StyledMenubarProps = MenubarProps & {
  xstyle?: StyleXStyles
}

export function Menubar(props: StyledMenubarProps) {
  const rootCompiled = () => stylex.attrs(styles.root, props.xstyle)
  const itemCompiled = () => stylex.attrs(styles.item)
  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().class, props.class)}
      style={props.style}
      itemClass={joinClassNames(itemCompiled().class, props.itemClass)}
      itemStyle={props.itemStyle}
      itemPressedStyle={{ ...props.itemPressedStyle }}
    />
  )
}

export type { MenubarItem, StyledMenubarProps as MenubarProps }
