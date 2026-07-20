import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { TreeView as Primitive } from "../../primitives/treeView/treeView"
import type { TreeViewItem, TreeViewProps } from "../../primitives/treeView/treeView"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

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
  },
  rowSelected: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    color: "rgb(var(--tbr-color-accent))",
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
  },
  toggleOpen: {
    transform: "rotate(90deg)",
  },
  toggleEmpty: {
    visibility: "hidden",
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
  const rootCompiled = () => stylex.props(styles.root, props.xstyle)
  const rowCompiled = () => stylex.props(styles.row)
  const rowSelectedCompiled = () => stylex.props(styles.rowSelected)
  const toggleCompiled = () => stylex.props(styles.buttonBase, styles.toggle)
  const toggleOpenCompiled = () => stylex.props(styles.toggleOpen)
  const toggleEmptyCompiled = () => stylex.props(styles.toggleEmpty)
  const labelCompiled = () => stylex.props(styles.buttonBase, styles.label)
  const iconCompiled = () => stylex.props(styles.icon)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
      rowClass={joinClassNames(rowCompiled().className, props.rowClass)}
      rowStyle={mergeSolidStyles(toSolidStyle(rowCompiled().style), props.rowStyle)}
      rowSelectedClass={joinClassNames(rowSelectedCompiled().className, props.rowSelectedClass)}
      rowSelectedStyle={mergeSolidStyles(
        toSolidStyle(rowSelectedCompiled().style),
        props.rowSelectedStyle,
      )}
      toggleClass={joinClassNames(toggleCompiled().className, props.toggleClass)}
      toggleStyle={mergeSolidStyles(toSolidStyle(toggleCompiled().style), props.toggleStyle)}
      toggleOpenClass={joinClassNames(toggleOpenCompiled().className, props.toggleOpenClass)}
      toggleOpenStyle={mergeSolidStyles(
        toSolidStyle(toggleOpenCompiled().style),
        props.toggleOpenStyle,
      )}
      toggleEmptyClass={joinClassNames(toggleEmptyCompiled().className, props.toggleEmptyClass)}
      toggleEmptyStyle={mergeSolidStyles(
        toSolidStyle(toggleEmptyCompiled().style),
        props.toggleEmptyStyle,
      )}
      labelClass={joinClassNames(labelCompiled().className, props.labelClass)}
      labelStyle={mergeSolidStyles(toSolidStyle(labelCompiled().style), props.labelStyle)}
      iconClass={joinClassNames(iconCompiled().className, props.iconClass)}
      iconStyle={mergeSolidStyles(toSolidStyle(iconCompiled().style), props.iconStyle)}
    />
  )
}

export type { TreeViewItem, StyledTreeViewProps as TreeViewProps }
