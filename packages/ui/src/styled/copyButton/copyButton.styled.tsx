import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, motion, radius } from "@tabora/theme/tokens.stylex"
import { CopyButton as P } from "../../primitives/copyButton/copyButton"
import type { CopyButtonProps } from "../../primitives/copyButton/copyButton"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.r2,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.textMuted,
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    fontSize: 11,
    gap: 4,
    height: 28,
    paddingBlock: 0,
    paddingInline: 10,
    transitionDuration: motion.fast,
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: motion.ease,
    ":hover": {
      backgroundColor: color.surfaceHover,
      borderColor: color.lineStrong,
    },
  },
  copied: {
    backgroundColor: color.accentSoft,
    borderColor: color.accent,
    color: color.accent,
  },
})

export type StyledCopyButtonProps = CopyButtonProps & {
  xstyle?: StyleXStyles
}

export function CopyButton(props: StyledCopyButtonProps) {
  const compiled = () => stylex.attrs(styles.root, props.xstyle)
  const copiedCompiled = () => stylex.attrs(styles.copied)

  return (
    <P
      {...props}
      class={joinClassNames(compiled().class, props.class)}
      style={props.style}
      copiedClass={joinClassNames(copiedCompiled().class, props.copiedClass)}
      copiedStyle={props.copiedStyle}
    />
  )
}
export type { StyledCopyButtonProps as CopyButtonProps }
