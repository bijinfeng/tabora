import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { ListRow as Primitive } from "../../primitives/listRow/listRow"
import type { ListRowProps } from "../../primitives/listRow/listRow"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

const styles = stylex.create({
  root: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderColor: "transparent",
    borderRadius: "var(--tbr-radius-control)",
    borderStyle: "solid",
    borderWidth: 1,
    color: "inherit",
    display: "flex",
    fontFamily: "inherit",
    fontSize: 13,
    gap: 10,
    minHeight: 36,
    paddingBlock: 8,
    paddingInline: 12,
    textAlign: "inherit",
    width: "100%",
    ":hover": {
      backgroundColor: "var(--tbr-list-row-hover-bg, rgb(var(--tbr-color-accent) / 0.06))",
    },
  },
  interactive: {
    cursor: "pointer",
    ":hover": {
      backgroundColor: "var(--tbr-list-row-hover-bg, rgb(var(--tbr-color-accent) / 0.06))",
      borderColor: "var(--tbr-list-row-hover-border, rgb(var(--tbr-color-line)))",
    },
  },
  selected: {
    backgroundColor: "rgb(var(--tbr-color-accent) / 0.08)",
    borderColor: "rgb(var(--tbr-color-accent) / 0.35)",
  },
  divider: {
    borderBottomColor: "rgb(var(--tbr-color-line))",
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    borderRadius: 0,
  },
  leading: {
    alignItems: "center",
    display: "flex",
    flexShrink: 0,
  },
  main: {
    flex: 1,
    minWidth: 0,
  },
  primary: {
    fontSize: 13,
  },
  primaryDanger: {
    color: "rgb(var(--tbr-color-danger))",
  },
  secondary: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 11,
    marginTop: 1,
  },
  trailing: {
    alignItems: "center",
    color: "rgb(var(--tbr-color-text-subtle))",
    display: "flex",
    flexShrink: 0,
    fontSize: 11,
  },
})

export type StyledListRowProps = ListRowProps & {
  xstyle?: StyleXStyles
}

export function ListRow(props: StyledListRowProps) {
  const rootCompiled = () =>
    stylex.props(
      styles.root,
      props.interactive === true && styles.interactive,
      props.interactive === undefined && props.onClick !== undefined && styles.interactive,
      props.selected && styles.selected,
      props.divider && styles.divider,
      props.xstyle,
    )
  const leadingCompiled = () => stylex.props(styles.leading)
  const mainCompiled = () => stylex.props(styles.main)
  const primaryCompiled = () => stylex.props(styles.primary, props.danger && styles.primaryDanger)
  const secondaryCompiled = () => stylex.props(styles.secondary)
  const trailingCompiled = () => stylex.props(styles.trailing)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
      leadingClass={joinClassNames(leadingCompiled().className, props.leadingClass)}
      leadingStyle={mergeSolidStyles(toSolidStyle(leadingCompiled().style), props.leadingStyle)}
      mainClass={joinClassNames(mainCompiled().className, props.mainClass)}
      mainStyle={mergeSolidStyles(toSolidStyle(mainCompiled().style), props.mainStyle)}
      primaryClass={joinClassNames(primaryCompiled().className, props.primaryClass)}
      primaryStyle={mergeSolidStyles(toSolidStyle(primaryCompiled().style), props.primaryStyle)}
      secondaryClass={joinClassNames(secondaryCompiled().className, props.secondaryClass)}
      secondaryStyle={mergeSolidStyles(
        toSolidStyle(secondaryCompiled().style),
        props.secondaryStyle,
      )}
      trailingClass={joinClassNames(trailingCompiled().className, props.trailingClass)}
      trailingStyle={mergeSolidStyles(toSolidStyle(trailingCompiled().style), props.trailingStyle)}
    />
  )
}

export type { StyledListRowProps as ListRowProps }
