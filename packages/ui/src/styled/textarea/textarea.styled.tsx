import * as stylex from "@stylexjs/stylex"

import { color, motion, radius } from "@tabora/theme/tokens.stylex"
import { HeadlessTextarea } from "../../primitives/textarea/textarea"
import type { HeadlessTextareaProps } from "../../primitives/textarea/textarea"
import type { XStyle } from "../../stylex"

const styles = stylex.create({
  root: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.text,
    display: "block",
    fontFamily: "inherit",
    lineHeight: 1.5,
    resize: "vertical",
    transitionDuration: motion.fast,
    transitionProperty: "border-color, box-shadow",
    transitionTimingFunction: motion.ease,
    width: "100%",
    "::placeholder": {
      color: color.textSubtle,
    },
    ":hover": {
      borderColor: color.lineStrong,
    },
    ":focus": {
      borderColor: color.accent,
      boxShadow: "0 0 0 3px rgb(var(--tbr-color-accent) / 0.12)",
      outline: "none",
    },
    ":disabled": {
      backgroundColor: color.surfaceSoft,
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
  sm: {
    fontSize: 12,
    paddingBlock: 6,
    paddingInline: 10,
  },
  md: {
    fontSize: 13,
    paddingBlock: 10,
    paddingInline: 12,
  },
  invalid: {
    borderColor: color.danger,
  },
})

export type TextareaProps = Omit<HeadlessTextareaProps, "class" | "style"> & {
  xstyle?: XStyle
}

export function Textarea(props: TextareaProps) {
  const compiled = () =>
    stylex.attrs(
      styles.root,
      props.size === "sm" && styles.sm,
      (!props.size || props.size === "md") && styles.md,
      props.invalid && styles.invalid,
      props.xstyle,
    )

  return <HeadlessTextarea {...props} class={compiled().class} style={undefined} />
}
