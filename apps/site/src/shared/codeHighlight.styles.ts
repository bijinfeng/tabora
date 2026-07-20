import * as stylex from "@stylexjs/stylex"

export const codeTokenStyles = stylex.create({
  keyword: {
    color: "rgb(var(--tbr-color-info))",
  },
  string: {
    color: "rgb(var(--tbr-color-success))",
  },
  number: {
    color: "rgb(var(--tbr-color-warning))",
  },
  comment: {
    color: "rgb(var(--tbr-color-text-subtle))",
  },
  tag: {
    color: "rgb(var(--tbr-color-accent))",
  },
  attr: {
    color: "rgb(var(--tbr-color-text-muted))",
  },
  punct: {
    color: "rgb(var(--tbr-color-text-subtle))",
  },
})
