import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Menubar as Primitive } from "../../primitives/menubar/menubar"
import type { MenubarItem, MenubarProps } from "../../primitives/menubar/menubar"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
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
    borderRadius: "var(--tbr-radius-2)",
    color: "rgb(var(--tbr-color-text-muted))",
    cursor: "pointer",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 500,
    minHeight: 30,
    paddingBlock: 0,
    paddingInline: 12,
    whiteSpace: "nowrap",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
      color: "rgb(var(--tbr-color-text))",
    },
  },
  pressed: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    color: "rgb(var(--tbr-color-accent))",
    fontWeight: 650,
  },
})

export type StyledMenubarProps = MenubarProps & {
  xstyle?: StyleXStyles
}

export function Menubar(props: StyledMenubarProps) {
  const rootCompiled = () => stylex.props(styles.root, props.xstyle)
  const itemCompiled = () => stylex.props(styles.item)
  const itemPressedCompiled = () => stylex.props(styles.pressed)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
      itemClass={joinClassNames(itemCompiled().className, props.itemClass)}
      itemStyle={mergeSolidStyles(toSolidStyle(itemCompiled().style), props.itemStyle)}
      itemPressedClass={joinClassNames(itemPressedCompiled().className, props.itemPressedClass)}
      itemPressedStyle={mergeSolidStyles(
        toSolidStyle(itemPressedCompiled().style),
        props.itemPressedStyle,
      )}
    />
  )
}

export type { MenubarItem, StyledMenubarProps as MenubarProps }
