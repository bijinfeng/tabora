import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"
import { splitProps } from "solid-js"

import { color, font, motion, radius, shadow } from "@tabora/theme/tokens.stylex"
import { Select as Primitive } from "../../primitives/select/select"
import type { SelectProps, SelectOption } from "../../primitives/select/select"

const styles = stylex.create({
  trigger: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "none",
    color: color.text,
    cursor: "pointer",
    display: "inline-flex",
    fontFamily: "inherit",
    fontSize: 13,
    fontWeight: font.medium,
    gap: 6,
    justifyContent: "space-between",
    minWidth: 180,
    transitionDuration: motion.fast,
    transitionProperty: "border-color, background-color, box-shadow",
    transitionTimingFunction: motion.ease,
    whiteSpace: "nowrap",
    width: "100%",
    ":hover": {
      backgroundColor: color.surfaceHover,
      borderColor: color.lineStrong,
    },
    ":focus-visible": {
      borderColor: color.accent,
      boxShadow: "0 0 0 3px rgb(var(--tbr-color-accent) / 0.12)",
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
    paddingBlock: 4,
    paddingInline: 8,
  },
  triggerMultipleSm: {
    minHeight: 28,
    paddingBlock: 2,
    paddingInline: 6,
  },
  triggerDisabled: {
    backgroundColor: color.surfaceSoft,
    cursor: "not-allowed",
    opacity: 0.5,
  },
  triggerInvalid: {
    borderColor: color.danger,
  },
  value: {
    color: color.text,
    flex: 1,
    minWidth: 0,
    overflow: "hidden",
    textAlign: "left",
    textOverflow: "ellipsis",
  },
  valueInvalid: {
    color: color.danger,
  },
  valuePlaceholder: {
    color: color.textSubtle,
  },
  icon: {
    alignItems: "center",
    color: color.textMuted,
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
    backgroundColor: color.accentSoft,
    borderRadius: radius.r1,
    color: color.accent,
    display: "inline-flex",
    fontSize: 11,
    fontWeight: font.semibold,
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
    transitionDuration: motion.fast,
    transitionProperty: "opacity",
    transitionTimingFunction: motion.ease,
    ":hover": {
      opacity: 1,
    },
  },
  tagMore: {
    alignItems: "center",
    backgroundColor: color.line,
    borderRadius: radius.r1,
    color: color.textMuted,
    display: "inline-flex",
    fontSize: 11,
    fontWeight: font.semibold,
    height: 22,
    paddingBlock: 0,
    paddingInline: 6,
  },
  placeholder: {
    color: color.textSubtle,
  },
  content: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: shadow.floating,
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
    color: color.text,
    cursor: "pointer",
    display: "flex",
    fontSize: 13,
    fontWeight: font.medium,
    gap: 8,
    maxWidth: "100%",
    minHeight: 34,
    outline: "none",
    paddingBlock: 8,
    paddingInline: 12,
    transitionDuration: motion.fast,
    transitionProperty: "background-color, color",
    transitionTimingFunction: motion.ease,
    width: "100%",
    ":hover": {
      backgroundColor: color.surfaceHover,
    },
    ":focus": {
      boxShadow: "none",
      outline: "none",
    },
    ":focus-visible": {
      boxShadow: "none",
      outline: "none",
    },
    "[data-selected]": {
      backgroundColor: color.accentSoft,
      color: color.accent,
      fontWeight: font.semibold,
    },
    "[data-disabled]": {
      cursor: "not-allowed",
      opacity: 0.5,
    },
  },
  itemSelected: {
    backgroundColor: color.accentSoft,
    color: color.accent,
    fontWeight: font.semibold,
  },
  itemDisabled: {
    cursor: "not-allowed",
    opacity: 0.5,
  },
  itemCheck: {
    alignItems: "center",
    color: color.accent,
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
