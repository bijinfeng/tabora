import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { HeadlessTextarea } from "../../primitives/textarea/textarea"
import type { HeadlessTextareaProps } from "../../primitives/textarea/textarea"
import { toSolidStyle } from "../../stylex"

const styles = stylex.create({
  root: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(var(--tbr-color-text))",
    display: "block",
    fontFamily: "inherit",
    lineHeight: 1.5,
    resize: "vertical",
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "border-color, box-shadow",
    transitionTimingFunction: "var(--tbr-ease)",
    width: "100%",
    "::placeholder": {
      color: "rgb(var(--tbr-color-text-muted))",
    },
    ":focus": {
      borderColor: "rgb(var(--tbr-color-accent))",
      boxShadow: "0 0 0 3px rgb(var(--tbr-color-accent) / 0.18)",
      outline: "none",
    },
    ":disabled": {
      backgroundColor: "rgb(var(--tbr-color-line) / 0.3)",
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
    borderColor: "rgb(var(--tbr-color-danger))",
  },
})

export type TextareaProps = Omit<HeadlessTextareaProps, "class" | "style"> & {
  xstyle?: StyleXStyles
}

export function Textarea(props: TextareaProps) {
  const compiled = () =>
    stylex.props(
      styles.root,
      props.size === "sm" && styles.sm,
      (!props.size || props.size === "md") && styles.md,
      props.invalid && styles.invalid,
      props.xstyle,
    )

  return (
    <HeadlessTextarea
      {...props}
      class={compiled().className}
      style={toSolidStyle(compiled().style)}
    />
  )
}
