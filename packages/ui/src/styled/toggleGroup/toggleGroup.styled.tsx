import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, font, motion, radius } from "@tabora/theme/tokens.stylex"
import { ToggleGroup as Primitive } from "../../primitives/toggleGroup/toggleGroup"
import type { ToggleGroupOption, ToggleGroupProps } from "../../primitives/toggleGroup/toggleGroup"

const styles = stylex.create({
  root: {
    display: "inline-flex",
    flexWrap: "wrap",
    gap: 6,
  },
  item: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.textMuted,
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: font.semibold,
    justifyContent: "center",
    minHeight: 30,
    paddingBlock: 0,
    paddingInline: 12,
    transitionDuration: motion.fast,
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: motion.ease,
    ":hover": {
      backgroundColor: color.surfaceHover,
      color: color.text,
    },
    ":focus-visible": {
      outline: `2px solid ${color.focus}`,
      outlineOffset: 2,
    },
    "[data-pressed]": {
      backgroundColor: color.accentSoft,
      borderColor: color.accent,
      color: color.accent,
    },
    "[data-disabled]": {
      cursor: "not-allowed",
      opacity: 0.45,
    },
  },
})

type ToggleGroupStyleProp =
  | "class"
  | "style"
  | "itemClass"
  | "itemSelectedClass"
  | "itemDisabledClass"

export type StyledToggleGroupProps = Omit<ToggleGroupProps, ToggleGroupStyleProp> & {
  xstyle?: StyleXStyles
}

export function ToggleGroup(props: StyledToggleGroupProps) {
  const rootCompiled = () => stylex.attrs(styles.root, props.xstyle)

  return (
    <Primitive
      {...props}
      class={rootCompiled().class}
      style={undefined}
      itemClass={stylex.attrs(styles.item).class}
    />
  )
}

export type { ToggleGroupOption, StyledToggleGroupProps as ToggleGroupProps }
