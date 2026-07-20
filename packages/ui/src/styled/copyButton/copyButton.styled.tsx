import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { CopyButton as P } from "../../primitives/copyButton/copyButton"
import type { CopyButtonProps } from "../../primitives/copyButton/copyButton"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-2)",
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(var(--tbr-color-text-muted))",
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    fontSize: 11,
    gap: 4,
    height: 28,
    paddingBlock: 0,
    paddingInline: 10,
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "background-color, border-color, color",
    transitionTimingFunction: "var(--tbr-ease)",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-accent) / 0.06)",
      borderColor: "rgb(var(--tbr-color-line-strong))",
    },
  },
  copied: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    borderColor: "rgb(var(--tbr-color-accent))",
    color: "rgb(var(--tbr-color-accent))",
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
