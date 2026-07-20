import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { RadioGroup as P } from "../../primitives/radioGroup/radioGroup"
import type { RadioGroupProps, RadioGroupOption } from "../../primitives/radioGroup/radioGroup"
import { toSolidStyle } from "../../stylex"

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
  },
  itemChecked: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    borderColor: "rgb(var(--tbr-color-accent))",
  },
  itemDisabled: {
    cursor: "not-allowed",
    opacity: 0.45,
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
  },
  controlChecked: {
    borderColor: "rgb(var(--tbr-color-accent))",
    boxShadow: "inset 0 0 0 5px rgb(var(--tbr-color-accent))",
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
  const rootCompiled = () => stylex.props(styles.root, props.xstyle)
  const listCompiled = () =>
    stylex.props(
      styles.list,
      props.direction === "horizontal" && styles.listHorizontal,
      (!props.direction || props.direction === "vertical") && styles.listVertical,
    )
  const itemCompiled = () => stylex.props(styles.item)
  const itemCheckedCompiled = () => stylex.props(styles.itemChecked)
  const itemDisabledCompiled = () => stylex.props(styles.itemDisabled)
  const inputCompiled = () => stylex.props(styles.input)
  const controlCompiled = () => stylex.props(styles.control)
  const controlCheckedCompiled = () => stylex.props(styles.controlChecked)
  const contentCompiled = () => stylex.props(styles.content)
  const labelCompiled = () => stylex.props(styles.label)
  const descriptionCompiled = () => stylex.props(styles.description)

  return (
    <P
      {...props}
      class={rootCompiled().className}
      style={toSolidStyle(rootCompiled().style)}
      listClass={listCompiled().className}
      listStyle={toSolidStyle(listCompiled().style)}
      itemClass={itemCompiled().className}
      itemCheckedClass={itemCheckedCompiled().className}
      itemDisabledClass={itemDisabledCompiled().className}
      inputClass={inputCompiled().className}
      inputStyle={toSolidStyle(inputCompiled().style)}
      controlClass={controlCompiled().className}
      controlCheckedClass={controlCheckedCompiled().className}
      contentClass={contentCompiled().className}
      labelClass={labelCompiled().className}
      descriptionClass={descriptionCompiled().className}
    />
  )
}

export type { StyledRadioGroupProps as RadioGroupProps, RadioGroupOption }
