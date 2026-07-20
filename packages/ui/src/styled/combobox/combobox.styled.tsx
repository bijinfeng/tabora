import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Combobox as P } from "../../primitives/combobox/combobox"
import type { ComboboxProps, ComboboxOption } from "../../primitives/combobox/combobox"

const styles = stylex.create({
  root: {
    display: "inline-block",
    position: "relative",
  },
  input: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    borderStyle: "solid",
    borderWidth: 1,
    color: "rgb(var(--tbr-color-text))",
    fontFamily: "inherit",
    fontSize: 13,
    height: "var(--tbr-control-md)",
    paddingBlock: 0,
    paddingInline: 12,
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "border-color, box-shadow",
    transitionTimingFunction: "var(--tbr-ease)",
    width: 260,
    ":focus": {
      borderColor: "rgb(var(--tbr-color-accent))",
      boxShadow: "0 0 0 3px rgb(var(--tbr-color-accent) / 0.12)",
      outline: "none",
    },
  },
  dropdown: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "0 4px 16px rgb(var(--tbr-color-shadow) / 0.08)",
    left: 0,
    maxHeight: 200,
    overflowY: "auto",
    position: "absolute",
    right: 0,
    top: "calc(100% + 4px)",
    zIndex: 50,
  },
  option: {
    cursor: "pointer",
    fontSize: 13,
    paddingBlock: 8,
    paddingInline: 12,
    transitionDuration: "120ms",
    transitionProperty: "background-color",
    transitionTimingFunction: "ease",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-accent) / 0.06)",
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
