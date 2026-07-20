import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { ListRow as Primitive } from "../../primitives/listRow/listRow"
import type { ListRowProps } from "../../primitives/listRow/listRow"
import { joinClassNames } from "../../stylex"

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
    stylex.attrs(
      styles.root,
      props.interactive === true && styles.interactive,
      props.interactive === undefined && props.onClick !== undefined && styles.interactive,
      props.selected && styles.selected,
      props.divider && styles.divider,
      props.xstyle,
    )
  const leadingCompiled = () => stylex.attrs(styles.leading)
  const mainCompiled = () => stylex.attrs(styles.main)
  const primaryCompiled = () => stylex.attrs(styles.primary, props.danger && styles.primaryDanger)
  const secondaryCompiled = () => stylex.attrs(styles.secondary)
  const trailingCompiled = () => stylex.attrs(styles.trailing)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().class, props.class)}
      style={props.style}
      leadingClass={joinClassNames(leadingCompiled().class, props.leadingClass)}
      leadingStyle={props.leadingStyle}
      mainClass={joinClassNames(mainCompiled().class, props.mainClass)}
      mainStyle={props.mainStyle}
      primaryClass={joinClassNames(primaryCompiled().class, props.primaryClass)}
      primaryStyle={props.primaryStyle}
      secondaryClass={joinClassNames(secondaryCompiled().class, props.secondaryClass)}
      secondaryStyle={{ ...props.secondaryStyle }}
      trailingClass={joinClassNames(trailingCompiled().class, props.trailingClass)}
      trailingStyle={props.trailingStyle}
    />
  )
}

export type { StyledListRowProps as ListRowProps }
