import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, font, motion, radius } from "@tabora/theme/tokens.stylex"
import { TagInput as Primitive } from "../../primitives/tagInput/tagInput"
import type { TagInputProps } from "../../primitives/tagInput/tagInput"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.text,
    display: "inline-flex",
    flexWrap: "wrap",
    gap: 4,
    minHeight: 36,
    minWidth: 220,
    paddingBlock: 4,
    paddingInline: 8,
    transitionDuration: motion.fast,
    transitionProperty: "border-color, box-shadow",
    transitionTimingFunction: motion.ease,
    width: 340,
    ":focus-within": {
      borderColor: color.accent,
      boxShadow: "0 0 0 3px rgb(var(--tbr-color-accent) / 0.12)",
    },
    ":hover": {
      borderColor: color.lineStrong,
    },
  },
  rootDisabled: {
    backgroundColor: color.surfaceSoft,
    cursor: "not-allowed",
    opacity: 0.5,
  },
  tag: {
    alignItems: "center",
    backgroundColor: color.accentSoft,
    borderColor: "transparent",
    borderRadius: radius.r1,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.accent,
    display: "inline-flex",
    fontSize: 11,
    fontWeight: font.semibold,
    gap: 3,
    height: 24,
    paddingBlock: 0,
    paddingInline: 6,
  },
  removeButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    color: color.accent,
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    fontSize: 9,
    height: 10,
    justifyContent: "center",
    lineHeight: 1,
    padding: 0,
    width: 10,
    opacity: 0.7,
    ":hover": {
      opacity: 1,
    },
    ":disabled": {
      cursor: "not-allowed",
    },
  },
  input: {
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    color: color.text,
    flex: 1,
    fontFamily: "inherit",
    fontSize: 13,
    height: 24,
    minWidth: 80,
    outline: "none",
    "::placeholder": {
      color: color.textSubtle,
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
