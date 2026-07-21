import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { TreeView as Primitive } from "../../primitives/treeView/treeView"
import type { TreeViewItem, TreeViewProps } from "../../primitives/treeView/treeView"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    display: "flex",
    flexDirection: "column",
    width: "100%",
  },
  row: {
    alignItems: "center",
    borderRadius: "var(--tbr-radius-2)",
    color: "rgb(var(--tbr-color-text))",
    display: "flex",
    gap: 4,
    minHeight: 30,
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
    },
    "[data-selected]": {
      backgroundColor: "rgb(var(--tbr-color-accent-soft))",
      color: "rgb(var(--tbr-color-accent))",
    },
  },
  buttonBase: {
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    color: "inherit",
    cursor: "pointer",
    fontFamily: "inherit",
  },
  toggle: {
    alignItems: "center",
    color: "rgb(var(--tbr-color-text-muted))",
    display: "inline-flex",
    fontSize: 14,
    height: 18,
    justifyContent: "center",
    transitionDuration: "var(--tbr-dur-normal)",
    transitionProperty: "transform",
    transitionTimingFunction: "var(--tbr-ease)",
    width: 18,
    "[data-open]": {
      transform: "rotate(90deg)",
    },
    "[data-empty]": {
      visibility: "hidden",
    },
  },
  label: {
    alignItems: "center",
    display: "inline-flex",
    flex: 1,
    fontSize: 13,
    gap: 6,
    minWidth: 0,
    paddingBlock: 5,
    paddingInline: 4,
    textAlign: "left",
  },
  icon: {
    color: "rgb(var(--tbr-color-text-muted))",
  },
})

export type StyledTreeViewProps = TreeViewProps & {
  xstyle?: StyleXStyles
}

export function TreeView(props: StyledTreeViewProps) {
  const rootCompiled = () => stylex.attrs(styles.root, props.xstyle)
  const rowCompiled = () => stylex.attrs(styles.row)
  const toggleCompiled = () => stylex.attrs(styles.buttonBase, styles.toggle)
  const labelCompiled = () => stylex.attrs(styles.buttonBase, styles.label)
  const iconCompiled = () => stylex.attrs(styles.icon)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().class, props.class)}
      style={props.style}
      rowClass={joinClassNames(rowCompiled().class, props.rowClass)}
      rowStyle={props.rowStyle}
      rowSelectedStyle={{ ...props.rowSelectedStyle }}
      toggleClass={joinClassNames(toggleCompiled().class, props.toggleClass)}
      toggleStyle={props.toggleStyle}
      toggleOpenStyle={{ ...props.toggleOpenStyle }}
      toggleEmptyStyle={{ ...props.toggleEmptyStyle }}
      labelClass={joinClassNames(labelCompiled().class, props.labelClass)}
      labelStyle={props.labelStyle}
      iconClass={joinClassNames(iconCompiled().class, props.iconClass)}
      iconStyle={props.iconStyle}
    />
  )
}

export type { TreeViewItem, StyledTreeViewProps as TreeViewProps }
