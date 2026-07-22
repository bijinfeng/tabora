import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, font, motion, radius } from "@tabora/theme/tokens.stylex"
import { Chip as P } from "../../primitives/chip/chip"
import type { ChipProps } from "../../primitives/chip/chip"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: color.surfaceSoft,
    borderColor: color.line,
    borderRadius: radius.pill,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.textMuted,
    cursor: "default",
    display: "inline-flex",
    fontSize: 12,
    fontWeight: font.medium,
    gap: 4,
    height: 24,
    paddingBlock: 0,
    paddingInline: 8,
    transitionDuration: motion.fast,
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: motion.ease,
    ":hover": {
      backgroundColor: color.surfaceHover,
      borderColor: color.lineStrong,
    },
  },
  selected: {
    backgroundColor: color.accentSoft,
    borderColor: color.accent,
    color: color.accent,
  },
  remove: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: "50%",
    color: color.textSubtle,
    cursor: "pointer",
    display: "inline-flex",
    fontSize: 10,
    height: 14,
    justifyContent: "center",
    padding: 0,
    width: 14,
    ":hover": {
      backgroundColor: color.dangerSoft,
      color: color.danger,
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
