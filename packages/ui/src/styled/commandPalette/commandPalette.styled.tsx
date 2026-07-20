import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { CommandPalette as Primitive } from "../../primitives/commandPalette/commandPalette"
import type {
  CommandPaletteGroup,
  CommandPaletteItem,
  CommandPaletteProps,
} from "../../primitives/commandPalette/commandPalette"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

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
  const rootCompiled = () => stylex.props(styles.root, props.xstyle)
  const boxCompiled = () => stylex.props(styles.box)
  const inputCompiled = () => stylex.props(styles.input)
  const listCompiled = () => stylex.props(styles.list)
  const emptyCompiled = () => stylex.props(styles.empty)
  const groupCompiled = () => stylex.props(styles.group)
  const groupLabelCompiled = () => stylex.props(styles.groupLabel)
  const itemCompiled = () => stylex.props(styles.item)
  const iconCompiled = () => stylex.props(styles.icon)
  const textCompiled = () => stylex.props(styles.text)
  const titleCompiled = () => stylex.props(styles.title)
  const descriptionCompiled = () => stylex.props(styles.description)
  const kbdCompiled = () => stylex.props(styles.kbd)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
      boxClass={joinClassNames(boxCompiled().className, props.boxClass)}
      boxStyle={mergeSolidStyles(toSolidStyle(boxCompiled().style), props.boxStyle)}
      inputClass={joinClassNames(inputCompiled().className, props.inputClass)}
      inputStyle={mergeSolidStyles(toSolidStyle(inputCompiled().style), props.inputStyle)}
      listClass={joinClassNames(listCompiled().className, props.listClass)}
      listStyle={mergeSolidStyles(toSolidStyle(listCompiled().style), props.listStyle)}
      emptyClass={joinClassNames(emptyCompiled().className, props.emptyClass)}
      emptyStyle={mergeSolidStyles(toSolidStyle(emptyCompiled().style), props.emptyStyle)}
      groupClass={joinClassNames(groupCompiled().className, props.groupClass)}
      groupStyle={mergeSolidStyles(toSolidStyle(groupCompiled().style), props.groupStyle)}
      groupLabelClass={joinClassNames(groupLabelCompiled().className, props.groupLabelClass)}
      groupLabelStyle={mergeSolidStyles(
        toSolidStyle(groupLabelCompiled().style),
        props.groupLabelStyle,
      )}
      itemClass={joinClassNames(itemCompiled().className, props.itemClass)}
      itemStyle={mergeSolidStyles(toSolidStyle(itemCompiled().style), props.itemStyle)}
      iconClass={joinClassNames(iconCompiled().className, props.iconClass)}
      iconStyle={mergeSolidStyles(toSolidStyle(iconCompiled().style), props.iconStyle)}
      textClass={joinClassNames(textCompiled().className, props.textClass)}
      textStyle={mergeSolidStyles(toSolidStyle(textCompiled().style), props.textStyle)}
      titleClass={joinClassNames(titleCompiled().className, props.titleClass)}
      titleStyle={mergeSolidStyles(toSolidStyle(titleCompiled().style), props.titleStyle)}
      descriptionClass={joinClassNames(descriptionCompiled().className, props.descriptionClass)}
      descriptionStyle={mergeSolidStyles(
        toSolidStyle(descriptionCompiled().style),
        props.descriptionStyle,
      )}
      kbdClass={joinClassNames(kbdCompiled().className, props.kbdClass)}
      kbdStyle={mergeSolidStyles(toSolidStyle(kbdCompiled().style), props.kbdStyle)}
    />
  )
}

export type {
  CommandPaletteGroup,
  CommandPaletteItem,
  StyledCommandPaletteProps as CommandPaletteProps,
}
