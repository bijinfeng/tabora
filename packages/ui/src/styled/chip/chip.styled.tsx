import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Chip as P } from "../../primitives/chip/chip"
import type { ChipProps } from "../../primitives/chip/chip"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: 999,
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(var(--tbr-color-text-muted))",
    cursor: "default",
    display: "inline-flex",
    fontSize: 12,
    fontWeight: 500,
    gap: 4,
    height: 24,
    paddingBlock: 0,
    paddingInline: 8,
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: "var(--tbr-ease)",
    ":hover": {
      borderColor: "rgb(var(--tbr-color-line-strong))",
    },
  },
  selected: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    borderColor: "rgb(var(--tbr-color-accent))",
    color: "rgb(var(--tbr-color-accent))",
  },
  remove: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: "50%",
    color: "rgb(var(--tbr-color-text-subtle))",
    cursor: "pointer",
    display: "inline-flex",
    fontSize: 10,
    height: 14,
    justifyContent: "center",
    padding: 0,
    width: 14,
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-danger) / 0.1)",
      color: "rgb(var(--tbr-color-danger))",
    },
  },
})

export type StyledChipProps = ChipProps & {
  xstyle?: StyleXStyles
}

export function Chip(props: StyledChipProps) {
  const rootCompiled = () =>
    stylex.attrs(styles.root, props.selected && styles.selected, props.xstyle)
  const removeCompiled = () => stylex.attrs(styles.remove)

  return (
    <P
      {...props}
      class={joinClassNames(rootCompiled().class, props.class)}
      style={props.style}
      removeClass={joinClassNames(removeCompiled().class, props.removeClass)}
      removeStyle={props.removeStyle}
    />
  )
}
export type { StyledChipProps as ChipProps }
