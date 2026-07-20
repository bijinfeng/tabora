import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { TagInput as Primitive } from "../../primitives/tagInput/tagInput"
import type { TagInputProps } from "../../primitives/tagInput/tagInput"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(var(--tbr-color-text))",
    display: "inline-flex",
    flexWrap: "wrap",
    gap: 6,
    minHeight: "var(--tbr-control-md)",
    minWidth: 220,
    paddingBlock: 4,
    paddingInline: 8,
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "border-color, box-shadow",
    transitionTimingFunction: "var(--tbr-ease)",
    width: "100%",
    ":focus-within": {
      borderColor: "rgb(var(--tbr-color-focus))",
      boxShadow: "0 0 0 3px rgb(var(--tbr-color-accent) / 0.12)",
    },
  },
  rootDisabled: {
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    cursor: "not-allowed",
    opacity: 0.5,
  },
  tag: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-pill)",
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(var(--tbr-color-text))",
    display: "inline-flex",
    fontSize: 12,
    fontWeight: 500,
    gap: 4,
    minHeight: 24,
    paddingBottom: 0,
    paddingLeft: 8,
    paddingRight: 6,
    paddingTop: 0,
  },
  removeButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: "var(--tbr-radius-1)",
    color: "rgb(var(--tbr-color-text-muted))",
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    fontSize: 11,
    height: 16,
    justifyContent: "center",
    lineHeight: 1,
    width: 16,
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
      color: "rgb(var(--tbr-color-text))",
    },
    ":disabled": {
      cursor: "not-allowed",
    },
  },
  input: {
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    color: "rgb(var(--tbr-color-text))",
    flex: 1,
    fontFamily: "inherit",
    fontSize: 13,
    height: 26,
    minWidth: 96,
    outline: "none",
    "::placeholder": {
      color: "rgb(var(--tbr-color-text-subtle))",
    },
  },
})

type TagInputStyleProp =
  | "class"
  | "style"
  | "tagClass"
  | "tagStyle"
  | "removeButtonClass"
  | "removeButtonStyle"
  | "inputClass"
  | "inputStyle"

export type StyledTagInputProps = Omit<TagInputProps, TagInputStyleProp> & {
  xstyle?: StyleXStyles
}

export function TagInput(props: StyledTagInputProps) {
  const rootCompiled = () =>
    stylex.attrs(styles.root, props.disabled && styles.rootDisabled, props.xstyle)
  const tagCompiled = () => stylex.attrs(styles.tag)
  const removeButtonCompiled = () => stylex.attrs(styles.removeButton)
  const inputCompiled = () => stylex.attrs(styles.input)

  return (
    <Primitive
      {...props}
      class={rootCompiled().class}
      style={undefined}
      tagClass={tagCompiled().class}
      tagStyle={undefined}
      removeButtonClass={removeButtonCompiled().class}
      removeButtonStyle={undefined}
      inputClass={inputCompiled().class}
      inputStyle={undefined}
    />
  )
}

export type { StyledTagInputProps as TagInputProps }
