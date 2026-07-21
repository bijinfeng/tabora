import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { RadioGroup as P } from "../../primitives/radioGroup/radioGroup"
import type { RadioGroupProps, RadioGroupOption } from "../../primitives/radioGroup/radioGroup"

const styles = stylex.create({
  root: {
    borderStyle: "none",
    borderWidth: 0,
    padding: 0,
  },
  list: {
    display: "flex",
    gap: 8,
  },
  listVertical: {
    flexDirection: "column",
  },
  listHorizontal: {
    flexDirection: "row",
  },
  item: {
    alignItems: "flex-start",
    borderColor: "transparent",
    borderRadius: "var(--tbr-radius-control)",
    borderStyle: "solid",
    borderWidth: 1,
    cursor: "pointer",
    display: "flex",
    fontSize: 13,
    gap: 8,
    paddingBlock: 6,
    paddingInline: 8,
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "background-color, border-color, opacity",
    transitionTimingFunction: "var(--tbr-ease)",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-accent) / 0.04)",
    },
    ":focus-within": {
      outline: "2px solid rgb(var(--tbr-color-focus))",
      outlineOffset: 2,
    },
    "[data-checked]": {
      backgroundColor: "rgb(var(--tbr-color-accent-soft))",
      borderColor: "rgb(var(--tbr-color-accent))",
    },
    "[data-disabled]": {
      cursor: "not-allowed",
      opacity: 0.45,
    },
  },
  input: {
    clip: "rect(0, 0, 0, 0)",
    height: 1,
    overflow: "hidden",
    position: "absolute",
    width: 1,
  },
  control: {
    borderColor: "rgb(var(--tbr-color-line-strong))",
    borderRadius: "50%",
    borderStyle: "solid",
    borderWidth: 1.5,
    flexShrink: 0,
    height: 18,
    marginTop: 1,
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "border-color, box-shadow",
    transitionTimingFunction: "var(--tbr-ease)",
    width: 18,
    "[data-checked]": {
      borderColor: "rgb(var(--tbr-color-accent))",
      boxShadow: "inset 0 0 0 5px rgb(var(--tbr-color-accent))",
    },
  },
  content: {
    display: "flex",
    flexDirection: "column",
  },
  label: {
    fontWeight: 500,
  },
  description: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 11,
    marginTop: 2,
  },
})

type RadioGroupStyleProp =
  | "class"
  | "style"
  | "listClass"
  | "listStyle"
  | "itemClass"
  | "itemCheckedClass"
  | "itemDisabledClass"
  | "inputClass"
  | "inputStyle"
  | "controlClass"
  | "controlCheckedClass"
  | "contentClass"
  | "labelClass"
  | "descriptionClass"

export type StyledRadioGroupProps<V extends string> = Omit<
  RadioGroupProps<V>,
  RadioGroupStyleProp
> & {
  xstyle?: StyleXStyles
}

export function RadioGroup<V extends string>(props: StyledRadioGroupProps<V>) {
  const rootCompiled = () => stylex.attrs(styles.root, props.xstyle)
  const listCompiled = () =>
    stylex.attrs(
      styles.list,
      props.direction === "horizontal" && styles.listHorizontal,
      (!props.direction || props.direction === "vertical") && styles.listVertical,
    )
  const itemCompiled = () => stylex.attrs(styles.item)
  const inputCompiled = () => stylex.attrs(styles.input)
  const controlCompiled = () => stylex.attrs(styles.control)
  const contentCompiled = () => stylex.attrs(styles.content)
  const labelCompiled = () => stylex.attrs(styles.label)
  const descriptionCompiled = () => stylex.attrs(styles.description)

  return (
    <P
      {...props}
      class={rootCompiled().class}
      style={undefined}
      listClass={listCompiled().class}
      listStyle={undefined}
      itemClass={itemCompiled().class}
      inputClass={inputCompiled().class}
      inputStyle={undefined}
      controlClass={controlCompiled().class}
      contentClass={contentCompiled().class}
      labelClass={labelCompiled().class}
      descriptionClass={descriptionCompiled().class}
    />
  )
}

export type { StyledRadioGroupProps as RadioGroupProps, RadioGroupOption }
