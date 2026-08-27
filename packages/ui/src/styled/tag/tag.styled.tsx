import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, font, motion, radius } from "@tabora/theme/tokens.stylex"
import {
  CheckableTag as PrimitiveCheckableTag,
  Tag as PrimitiveTag,
} from "../../primitives/tag/tag"
import type { CheckableTagProps, TagProps } from "../../primitives/tag/tag"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: color.surfaceSoft,
    borderColor: color.line,
    borderRadius: radius.r1,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.textMuted,
    display: "inline-flex",
    fontSize: 12,
    fontWeight: font.medium,
    gap: 3,
    height: 22,
    lineHeight: 1,
    paddingBlock: 0,
    paddingInline: 6,
    whiteSpace: "nowrap",
  },
  borderless: {
    borderColor: "transparent",
  },
  closeButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    color: color.textSubtle,
    cursor: "pointer",
    display: "inline-flex",
    height: 14,
    justifyContent: "center",
    marginInlineEnd: -2,
    padding: 0,
    width: 14,
    ":hover": {
      color: color.text,
    },
    ":focus-visible": {
      outline: `2px solid ${color.focus}`,
      outlineOffset: 1,
    },
  },
  checkable: {
    cursor: "pointer",
    fontFamily: "inherit",
    transitionDuration: motion.fast,
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: motion.ease,
    ":hover": {
      backgroundColor: color.surfaceHover,
      borderColor: color.lineStrong,
      color: color.text,
    },
    ":focus-visible": {
      outline: `2px solid ${color.focus}`,
      outlineOffset: 2,
    },
  },
  interactive: {
    cursor: "pointer",
    fontFamily: "inherit",
    transitionDuration: motion.fast,
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: motion.ease,
    ":hover": {
      backgroundColor: color.surfaceHover,
      borderColor: color.lineStrong,
      color: color.text,
    },
    ":focus-visible": {
      outline: `2px solid ${color.focus}`,
      outlineOffset: 2,
    },
  },
  checked: {
    backgroundColor: color.accentSoft,
    borderColor: color.accent,
    color: color.accent,
    ":hover": {
      backgroundColor: color.accentSoft,
      borderColor: color.accent,
      color: color.accent,
    },
  },
})

export type StyledTagProps = TagProps & {
  xstyle?: StyleXStyles
}

export function Tag(props: StyledTagProps) {
  const rootCompiled = () =>
    stylex.attrs(
      styles.root,
      props.bordered === false && styles.borderless,
      props.onClick && !props.closable && styles.interactive,
      props.xstyle,
    )
  const closeCompiled = () => stylex.attrs(styles.closeButton)

  return (
    <PrimitiveTag
      {...props}
      class={rootCompiled().class}
      style={undefined}
      closeButtonClass={closeCompiled().class}
      closeButtonStyle={undefined}
    />
  )
}

export type StyledCheckableTagProps = CheckableTagProps & {
  xstyle?: StyleXStyles
}

export function CheckableTag(props: StyledCheckableTagProps) {
  const compiled = () =>
    stylex.attrs(styles.root, styles.checkable, props.checked && styles.checked, props.xstyle)

  return <PrimitiveCheckableTag {...props} class={compiled().class} style={undefined} />
}

export type { StyledTagProps as TagProps, StyledCheckableTagProps as CheckableTagProps }
