import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"
import { splitProps } from "solid-js"

import { Select as Primitive } from "../../primitives/select/select"
import type { SelectProps, SelectOption } from "../../primitives/select/select"

const styles = stylex.create({
  trigger: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "none",
    color: "rgb(var(--tbr-color-text))",
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: 500,
    gap: 8,
    justifyContent: "space-between",
    minWidth: 188,
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "border-color, background-color, box-shadow",
    transitionTimingFunction: "var(--tbr-ease)",
    whiteSpace: "nowrap",
    width: "100%",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-soft))",
      borderColor: "rgb(var(--tbr-color-line-strong))",
    },
    ":focus-visible": {
      borderColor: "rgb(var(--tbr-color-focus))",
      boxShadow:
        "0 0 0 1px rgb(var(--tbr-color-focus)), 0 0 0 4px rgb(var(--tbr-color-accent) / 0.14)",
      outline: "none",
    },
  },
  triggerSm: {
    fontSize: 12,
    height: 28,
    paddingBlock: 0,
    paddingInline: 10,
  },
  triggerMd: {
    height: 36,
    paddingBlock: 0,
    paddingInline: 12,
  },
  triggerMultiple: {
    height: "auto",
    minHeight: 36,
    paddingBottom: 4,
    paddingLeft: 8,
    paddingRight: 36,
    paddingTop: 4,
  },
  triggerMultipleSm: {
    minHeight: 28,
    paddingBottom: 2,
    paddingLeft: 6,
    paddingRight: 32,
    paddingTop: 2,
  },
  triggerDisabled: {
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    cursor: "not-allowed",
    opacity: 0.5,
  },
  triggerInvalid: {
    borderColor: "rgb(var(--tbr-color-danger))",
  },
  value: {
    color: "rgb(var(--tbr-color-text))",
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textAlign: "left",
    textOverflow: "ellipsis",
  },
  valueInvalid: {
    color: "rgb(var(--tbr-color-danger))",
  },
  valuePlaceholder: {
    color: "rgb(var(--tbr-color-text-subtle))",
  },
  icon: {
    alignItems: "center",
    color: "rgb(var(--tbr-color-text-muted))",
    display: "inline-flex",
    flex: "none",
    height: 16,
    justifyContent: "center",
    width: 16,
  },
  tags: {
    display: "flex",
    flex: 1,
    flexWrap: "wrap",
    gap: 4,
    minWidth: 0,
  },
  tag: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-accent) / 0.12)",
    borderRadius: 4,
    color: "rgb(var(--tbr-color-accent))",
    display: "inline-flex",
    fontSize: 11,
    fontWeight: 600,
    gap: 3,
    height: 22,
    paddingBlock: 0,
    paddingInline: 6,
    whiteSpace: "nowrap",
  },
  tagRemove: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    color: "currentColor",
    cursor: "pointer",
    display: "inline-flex",
    justifyContent: "center",
    opacity: 0.6,
    padding: 0,
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "opacity",
    transitionTimingFunction: "var(--tbr-ease)",
    ":hover": {
      opacity: 1,
    },
  },
  tagMore: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-line) / 0.5)",
    borderRadius: 4,
    color: "rgb(var(--tbr-color-text-muted))",
    display: "inline-flex",
    fontSize: 11,
    fontWeight: 600,
    height: 22,
    paddingBlock: 0,
    paddingInline: 6,
  },
  placeholder: {
    color: "rgb(var(--tbr-color-text-subtle))",
  },
  content: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow:
      "0 4px 16px rgb(var(--tbr-color-shadow) / 0.08), 0 0 1px rgb(var(--tbr-color-shadow) / 0.06)",
    boxSizing: "border-box",
    maxHeight: 260,
    maxWidth: "var(--kb-select-trigger-width)",
    minWidth: "var(--kb-select-trigger-width)",
    overflowX: "hidden",
    overflowY: "hidden",
    paddingBlock: 4,
    paddingInline: 0,
    width: "var(--kb-select-trigger-width)",
    zIndex: 50,
  },
  listbox: {
    borderStyle: "none",
    borderWidth: 0,
    boxSizing: "border-box",
    maxWidth: "100%",
    outline: "none",
    overflowX: "hidden",
    overflowY: "auto",
    padding: 0,
    width: "100%",
  },
  item: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: 0,
    boxSizing: "border-box",
    color: "rgb(var(--tbr-color-text))",
    cursor: "pointer",
    display: "flex",
    fontSize: 13,
    fontWeight: 500,
    gap: 8,
    maxWidth: "100%",
    minHeight: 34,
    outline: "none",
    paddingBlock: 0,
    paddingInline: 12,
    transitionDuration: "120ms",
    transitionProperty: "background-color, color",
    transitionTimingFunction: "ease",
    width: "100%",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    },
    ":focus": {
      boxShadow: "none",
      outline: "none",
    },
    ":focus-visible": {
      boxShadow: "none",
      outline: "none",
    },
  },
  itemSelected: {
    backgroundColor: "rgb(var(--tbr-color-accent) / 0.08)",
    color: "rgb(var(--tbr-color-accent))",
  },
  itemDisabled: {
    cursor: "not-allowed",
    opacity: 0.4,
  },
  itemCheck: {
    alignItems: "center",
    color: "rgb(var(--tbr-color-accent))",
    display: "inline-flex",
    flex: "none",
    height: 16,
    justifyContent: "center",
    width: 16,
  },
  itemLabel: {
    flex: 1,
    maxWidth: "100%",
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
})

type SelectStyleProp =
  | "class"
  | "style"
  | "valueClass"
  | "valueInvalidClass"
  | "valuePlaceholderClass"
  | "iconClass"
  | "tagsClass"
  | "tagClass"
  | "tagRemoveClass"
  | "tagMoreClass"
  | "placeholderClass"
  | "contentClass"
  | "contentStyle"
  | "listboxClass"
  | "itemClass"
  | "itemSelectedClass"
  | "itemDisabledClass"
  | "itemCheckClass"
  | "itemLabelClass"

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

export type StyledSelectProps<V extends string> = DistributiveOmit<
  SelectProps<V>,
  SelectStyleProp
> & {
  xstyle?: StyleXStyles
}

export function Select<V extends string>(props: StyledSelectProps<V>) {
  const [local, primitiveProps] = splitProps(props, ["xstyle"])
  const triggerCompiled = () =>
    stylex.attrs(
      styles.trigger,
      props.size === "sm" && styles.triggerSm,
      (!props.size || props.size === "md") && styles.triggerMd,
      props.multiple === true && styles.triggerMultiple,
      props.multiple === true && props.size === "sm" && styles.triggerMultipleSm,
      props.disabled && styles.triggerDisabled,
      props.invalid && styles.triggerInvalid,
      local.xstyle,
    )
  const valueCompiled = () => stylex.attrs(styles.value)
  const valueInvalidCompiled = () => stylex.attrs(styles.valueInvalid)
  const valuePlaceholderCompiled = () => stylex.attrs(styles.valuePlaceholder)
  const iconCompiled = () => stylex.attrs(styles.icon)
  const tagsCompiled = () => stylex.attrs(styles.tags)
  const tagCompiled = () => stylex.attrs(styles.tag)
  const tagRemoveCompiled = () => stylex.attrs(styles.tagRemove)
  const tagMoreCompiled = () => stylex.attrs(styles.tagMore)
  const placeholderCompiled = () => stylex.attrs(styles.placeholder)
  const contentCompiled = () => stylex.attrs(styles.content)
  const listboxCompiled = () => stylex.attrs(styles.listbox)
  const itemCompiled = () => stylex.attrs(styles.item)
  const itemSelectedCompiled = () => stylex.attrs(styles.itemSelected)
  const itemDisabledCompiled = () => stylex.attrs(styles.itemDisabled)
  const itemCheckCompiled = () => stylex.attrs(styles.itemCheck)
  const itemLabelCompiled = () => stylex.attrs(styles.itemLabel)

  return (
    <Primitive<V>
      {...(primitiveProps as SelectProps<V>)}
      class={triggerCompiled().class}
      style={undefined}
      valueClass={valueCompiled().class}
      valueInvalidClass={valueInvalidCompiled().class}
      valuePlaceholderClass={valuePlaceholderCompiled().class}
      iconClass={iconCompiled().class}
      tagsClass={tagsCompiled().class}
      tagClass={tagCompiled().class}
      tagRemoveClass={tagRemoveCompiled().class}
      tagMoreClass={tagMoreCompiled().class}
      placeholderClass={placeholderCompiled().class}
      contentClass={contentCompiled().class}
      contentStyle={undefined}
      listboxClass={listboxCompiled().class}
      itemClass={itemCompiled().class}
      itemSelectedClass={itemSelectedCompiled().class}
      itemDisabledClass={itemDisabledCompiled().class}
      itemCheckClass={itemCheckCompiled().class}
      itemLabelClass={itemLabelCompiled().class}
    />
  )
}

export type { StyledSelectProps as SelectProps, SelectOption }
