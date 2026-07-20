import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { SegmentedControl as Primitive } from "../../primitives/segmentedControl/segmentedControl"
import type {
  SegmentedControlProps,
  SegmentedControlOption,
} from "../../primitives/segmentedControl/segmentedControl"
import { toSolidStyle } from "../../stylex"

const styles = stylex.create({
  root: {
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
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
    fontWeight: 600,
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "background-color, box-shadow, color",
    transitionTimingFunction: "var(--tbr-ease)",
    whiteSpace: "nowrap",
    ":hover": {
      color: "rgb(var(--tbr-color-text))",
    },
    ":focus-visible": {
      outline: "2px solid rgb(var(--tbr-color-focus))",
      outlineOffset: -2,
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
  itemSelected: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    boxShadow: "0 1px 2px rgb(var(--tbr-color-shadow) / 0.06)",
    color: "rgb(var(--tbr-color-text))",
  },
  itemDisabled: {
    cursor: "not-allowed",
    opacity: 0.4,
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
  const rootCompiled = () => stylex.props(styles.root, props.xstyle)
  const itemCompiled = () =>
    stylex.props(
      styles.item,
      props.size === "sm" && styles.itemSm,
      (!props.size || props.size === "md") && styles.itemMd,
    )
  const itemSelectedCompiled = () => stylex.props(styles.itemSelected)
  const itemDisabledCompiled = () => stylex.props(styles.itemDisabled)

  return (
    <Primitive
      {...props}
      class={rootCompiled().className}
      style={toSolidStyle(rootCompiled().style)}
      itemClass={itemCompiled().className}
      itemSelectedClass={itemSelectedCompiled().className}
      itemDisabledClass={itemDisabledCompiled().className}
    />
  )
}

export type { StyledSegmentedControlProps as SegmentedControlProps, SegmentedControlOption }
