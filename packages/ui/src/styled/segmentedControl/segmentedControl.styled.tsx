import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, font, motion, radius } from "@tabora/theme/tokens.stylex"
import { SegmentedControl as Primitive } from "../../primitives/segmentedControl/segmentedControl"
import type {
  SegmentedControlProps,
  SegmentedControlOption,
} from "../../primitives/segmentedControl/segmentedControl"

const styles = stylex.create({
  root: {
    backgroundColor: color.surfaceSoft,
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
    fontWeight: font.semibold,
    transitionDuration: motion.fast,
    transitionProperty: "background-color, box-shadow, color",
    transitionTimingFunction: motion.ease,
    whiteSpace: "nowrap",
    ":hover": {
      color: color.text,
    },
    ":focus-visible": {
      outline: `2px solid ${color.focus}`,
      outlineOffset: -2,
    },
    "[data-pressed]": {
      backgroundColor: color.surface,
      boxShadow: "0 1px 2px rgb(var(--tbr-color-shadow) / 0.06)",
      color: color.text,
    },
    "[data-disabled]": {
      cursor: "not-allowed",
      opacity: 0.4,
    },
  },
  itemSm: {
    fontSize: 11,
    height: 24,
    paddingBlock: 0,
    paddingInline: 8,
  },
  itemMd: {
    fontSize: 12,
    height: 30,
    paddingBlock: 0,
    paddingInline: 12,
  },
})

type SegmentedControlStyleProp =
  | "class"
  | "style"
  | "itemClass"
  | "itemSelectedClass"
  | "itemDisabledClass"

export type StyledSegmentedControlProps<V extends string> = Omit<
  SegmentedControlProps<V>,
  SegmentedControlStyleProp
> & {
  xstyle?: StyleXStyles
}

export function SegmentedControl<V extends string>(props: StyledSegmentedControlProps<V>) {
  const rootCompiled = () => stylex.attrs(styles.root, props.xstyle)
  const itemCompiled = () =>
    stylex.attrs(
      styles.item,
      props.size === "sm" && styles.itemSm,
      (!props.size || props.size === "md") && styles.itemMd,
    )
  return (
    <Primitive
      {...props}
      class={rootCompiled().class}
      style={undefined}
      itemClass={itemCompiled().class}
    />
  )
}

export type { StyledSegmentedControlProps as SegmentedControlProps, SegmentedControlOption }
