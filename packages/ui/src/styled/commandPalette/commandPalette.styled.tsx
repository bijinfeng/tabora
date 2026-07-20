import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { CommandPalette as Primitive } from "../../primitives/commandPalette/commandPalette"
import type {
  CommandPaletteGroup,
  CommandPaletteItem,
  CommandPaletteProps,
} from "../../primitives/commandPalette/commandPalette"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    display: "block",
    width: "min(100%, 560px)",
  },
  box: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-panel)",
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow:
      "0 20px 48px rgb(var(--tbr-color-shadow-strong) / 0.16), 0 0 1px rgb(var(--tbr-color-shadow) / 0.08)",
    overflow: "hidden",
  },
  input: {
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderBottomColor: "rgb(var(--tbr-color-line))",
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    color: "rgb(var(--tbr-color-text))",
    fontFamily: "inherit",
    fontSize: 14,
    height: 48,
    outline: "none",
    paddingBlock: 0,
    paddingInline: 16,
    width: "100%",
    "::placeholder": {
      color: "rgb(var(--tbr-color-text-subtle))",
    },
  },
  list: {
    maxHeight: 320,
    overflow: "auto",
    padding: 8,
  },
  group: {
    ":not(:first-child)": {
      marginTop: 8,
    },
  },
  groupLabel: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.06em",
    paddingBottom: 2,
    paddingLeft: 12,
    paddingRight: 12,
    paddingTop: 7,
    textTransform: "uppercase",
  },
  item: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: "var(--tbr-radius-control)",
    color: "rgb(var(--tbr-color-text))",
    cursor: "pointer",
    display: "flex",
    fontFamily: "inherit",
    gap: 8,
    minHeight: 42,
    paddingBlock: 7,
    paddingInline: 12,
    textAlign: "left",
    width: "100%",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
      outline: "none",
    },
    ":focus-visible": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
      outline: "none",
    },
  },
  icon: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    borderRadius: 5,
    color: "rgb(var(--tbr-color-accent))",
    display: "inline-flex",
    flex: "none",
    fontSize: 12,
    height: 24,
    justifyContent: "center",
    width: 24,
  },
  text: {
    display: "grid",
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  title: {
    fontSize: 12,
    fontWeight: 600,
  },
  description: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 11,
  },
  kbd: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontFamily: '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    fontSize: 10,
  },
  empty: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 13,
    paddingBlock: 28,
    paddingInline: 12,
    textAlign: "center",
  },
})

export type StyledCommandPaletteProps = CommandPaletteProps & {
  xstyle?: StyleXStyles
}

export function CommandPalette(props: StyledCommandPaletteProps) {
  const rootCompiled = () => stylex.attrs(styles.root, props.xstyle)
  const boxCompiled = () => stylex.attrs(styles.box)
  const inputCompiled = () => stylex.attrs(styles.input)
  const listCompiled = () => stylex.attrs(styles.list)
  const emptyCompiled = () => stylex.attrs(styles.empty)
  const groupCompiled = () => stylex.attrs(styles.group)
  const groupLabelCompiled = () => stylex.attrs(styles.groupLabel)
  const itemCompiled = () => stylex.attrs(styles.item)
  const iconCompiled = () => stylex.attrs(styles.icon)
  const textCompiled = () => stylex.attrs(styles.text)
  const titleCompiled = () => stylex.attrs(styles.title)
  const descriptionCompiled = () => stylex.attrs(styles.description)
  const kbdCompiled = () => stylex.attrs(styles.kbd)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().class, props.class)}
      style={props.style}
      boxClass={joinClassNames(boxCompiled().class, props.boxClass)}
      boxStyle={props.boxStyle}
      inputClass={joinClassNames(inputCompiled().class, props.inputClass)}
      inputStyle={props.inputStyle}
      listClass={joinClassNames(listCompiled().class, props.listClass)}
      listStyle={props.listStyle}
      emptyClass={joinClassNames(emptyCompiled().class, props.emptyClass)}
      emptyStyle={props.emptyStyle}
      groupClass={joinClassNames(groupCompiled().class, props.groupClass)}
      groupStyle={props.groupStyle}
      groupLabelClass={joinClassNames(groupLabelCompiled().class, props.groupLabelClass)}
      groupLabelStyle={{ ...props.groupLabelStyle }}
      itemClass={joinClassNames(itemCompiled().class, props.itemClass)}
      itemStyle={props.itemStyle}
      iconClass={joinClassNames(iconCompiled().class, props.iconClass)}
      iconStyle={props.iconStyle}
      textClass={joinClassNames(textCompiled().class, props.textClass)}
      textStyle={props.textStyle}
      titleClass={joinClassNames(titleCompiled().class, props.titleClass)}
      titleStyle={props.titleStyle}
      descriptionClass={joinClassNames(descriptionCompiled().class, props.descriptionClass)}
      descriptionStyle={{ ...props.descriptionStyle }}
      kbdClass={joinClassNames(kbdCompiled().class, props.kbdClass)}
      kbdStyle={props.kbdStyle}
    />
  )
}

export type {
  CommandPaletteGroup,
  CommandPaletteItem,
  StyledCommandPaletteProps as CommandPaletteProps,
}
