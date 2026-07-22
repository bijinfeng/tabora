import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { color, font, motion, radius, shadow } from "@tabora/theme/tokens.stylex"
import { Combobox as P } from "../../primitives/combobox/combobox"
import type { ComboboxProps, ComboboxOption } from "../../primitives/combobox/combobox"

const styles = stylex.create({
  root: {
    display: "inline-block",
    position: "relative",
  },
  input: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.text,
    fontFamily: "inherit",
    fontSize: 13,
    height: 36,
    paddingBlock: 0,
    paddingInline: 12,
    transitionDuration: motion.fast,
    transitionProperty: "border-color, box-shadow",
    transitionTimingFunction: motion.ease,
    width: 260,
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
  },
  dropdown: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: shadow.floating,
    maxHeight: 220,
    overflowY: "auto",
    position: "relative",
    zIndex: 50,
  },
  option: {
    cursor: "pointer",
    fontSize: 13,
    paddingBlock: 8,
    paddingInline: 12,
    transitionDuration: motion.fast,
    transitionProperty: "background-color",
    transitionTimingFunction: motion.ease,
    ":hover": {
      backgroundColor: color.surfaceHover,
    },
    "[data-selected]": {
      backgroundColor: color.surfaceHover,
      fontWeight: font.medium,
    },
  },
})

type ComboboxStyleProp =
  | "class"
  | "style"
  | "inputClass"
  | "inputStyle"
  | "dropdownClass"
  | "dropdownStyle"
  | "optionClass"

export type StyledComboboxProps<V extends string> = Omit<ComboboxProps<V>, ComboboxStyleProp> & {
  xstyle?: StyleXStyles
}

export function Combobox<V extends string>(props: StyledComboboxProps<V>) {
  const rootCompiled = () => stylex.attrs(styles.root, props.xstyle)
  const inputCompiled = () => stylex.attrs(styles.input)
  const dropdownCompiled = () => stylex.attrs(styles.dropdown)
  const optionCompiled = () => stylex.attrs(styles.option)

  return (
    <P
      {...props}
      class={rootCompiled().class}
      style={undefined}
      inputClass={inputCompiled().class}
      inputStyle={undefined}
      dropdownClass={dropdownCompiled().class}
      dropdownStyle={undefined}
      optionClass={optionCompiled().class}
    />
  )
}

export type { StyledComboboxProps as ComboboxProps, ComboboxOption }
