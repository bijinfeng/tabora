import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Table as Primitive } from "../../primitives/table/table"
import type { TableColumn, TableProps } from "../../primitives/table/table"
import { joinClassNames } from "../../stylex"

const styles = stylex.create({
  root: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    borderStyle: "solid",
    borderWidth: 1,
    overflow: "auto",
    width: "100%",
  },
  table: {
    borderCollapse: "collapse",
    fontSize: 12,
    width: "100%",
  },
  headerCell: {
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderBottomColor: "rgb(var(--tbr-color-line))",
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    color: "rgb(var(--tbr-color-text))",
    fontSize: 11,
    fontWeight: 650,
    paddingBlock: 9,
    paddingInline: 12,
    textAlign: "left",
    whiteSpace: "nowrap",
  },
  row: {
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    },
  },
  rowSelected: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
  },
  cell: {
    borderBottomColor: "rgb(var(--tbr-color-line))",
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    color: "rgb(var(--tbr-color-text-muted))",
    lineHeight: 1.5,
    paddingBlock: 8,
    paddingInline: 12,
  },
  cellSelected: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    color: "rgb(var(--tbr-color-accent))",
  },
  cellLastRow: {
    borderBottomWidth: 0,
  },
  alignCenter: {
    textAlign: "center",
  },
  alignEnd: {
    textAlign: "right",
  },
})

export type StyledTableProps<T> = TableProps<T> & {
  xstyle?: StyleXStyles
}

export function Table<T>(props: StyledTableProps<T>) {
  const rootCompiled = () => stylex.attrs(styles.root, props.xstyle)
  const tableCompiled = () => stylex.attrs(styles.table)
  const rowCompiled = () => stylex.attrs(styles.row)
  const rowSelectedCompiled = () => stylex.attrs(styles.rowSelected)
  const headerCellCompiled = () => stylex.attrs(styles.headerCell)
  const cellCompiled = () => stylex.attrs(styles.cell)
  const cellSelectedCompiled = () => stylex.attrs(styles.cellSelected)
  const cellLastRowCompiled = () => stylex.attrs(styles.cellLastRow)
  const alignCenterCompiled = () => stylex.attrs(styles.alignCenter)
  const alignEndCompiled = () => stylex.attrs(styles.alignEnd)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().class, props.class)}
      style={props.style}
      tableClass={joinClassNames(tableCompiled().class, props.tableClass)}
      tableStyle={props.tableStyle}
      rowClass={joinClassNames(rowCompiled().class, props.rowClass)}
      rowStyle={props.rowStyle}
      rowSelectedClass={joinClassNames(rowSelectedCompiled().class, props.rowSelectedClass)}
      rowSelectedStyle={{ ...props.rowSelectedStyle }}
      headerCellClass={joinClassNames(headerCellCompiled().class, props.headerCellClass)}
      headerCellStyle={{ ...props.headerCellStyle }}
      cellClass={joinClassNames(cellCompiled().class, props.cellClass)}
      cellStyle={props.cellStyle}
      cellSelectedClass={joinClassNames(cellSelectedCompiled().class, props.cellSelectedClass)}
      cellSelectedStyle={{ ...props.cellSelectedStyle }}
      cellLastRowClass={joinClassNames(cellLastRowCompiled().class, props.cellLastRowClass)}
      cellLastRowStyle={{ ...props.cellLastRowStyle }}
      alignCenterClass={joinClassNames(alignCenterCompiled().class, props.alignCenterClass)}
      alignCenterStyle={{ ...props.alignCenterStyle }}
      alignEndClass={joinClassNames(alignEndCompiled().class, props.alignEndClass)}
      alignEndStyle={props.alignEndStyle}
    />
  )
}

export type { TableColumn, StyledTableProps as TableProps }
