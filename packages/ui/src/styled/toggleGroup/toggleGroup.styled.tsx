import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

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
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(var(--tbr-color-text-muted))",
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    fontSize: 12,
    fontWeight: 600,
    justifyContent: "center",
    minHeight: 30,
    paddingBlock: 0,
    paddingInline: 12,
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: "var(--tbr-ease)",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
      color: "rgb(var(--tbr-color-text))",
    },
    ":focus-visible": {
      outline: "2px solid rgb(var(--tbr-color-focus))",
      outlineOffset: 2,
    },
    "[data-pressed]": {
      backgroundColor: "rgb(var(--tbr-color-accent-soft))",
      borderColor: "rgb(var(--tbr-color-accent))",
      color: "rgb(var(--tbr-color-accent))",
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
