import * as stylex from "@stylexjs/stylex"
import type { StyleXStyles } from "@stylexjs/stylex"

import { Table as Primitive } from "../../primitives/table/table"
import type { TableColumn, TableProps } from "../../primitives/table/table"
import { joinClassNames, mergeSolidStyles, toSolidStyle } from "../../stylex"

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
  const rootCompiled = () => stylex.props(styles.root, props.xstyle)
  const tableCompiled = () => stylex.props(styles.table)
  const rowCompiled = () => stylex.props(styles.row)
  const rowSelectedCompiled = () => stylex.props(styles.rowSelected)
  const headerCellCompiled = () => stylex.props(styles.headerCell)
  const cellCompiled = () => stylex.props(styles.cell)
  const cellSelectedCompiled = () => stylex.props(styles.cellSelected)
  const cellLastRowCompiled = () => stylex.props(styles.cellLastRow)
  const alignCenterCompiled = () => stylex.props(styles.alignCenter)
  const alignEndCompiled = () => stylex.props(styles.alignEnd)

  return (
    <Primitive
      {...props}
      class={joinClassNames(rootCompiled().className, props.class)}
      style={mergeSolidStyles(toSolidStyle(rootCompiled().style), props.style)}
      tableClass={joinClassNames(tableCompiled().className, props.tableClass)}
      tableStyle={mergeSolidStyles(toSolidStyle(tableCompiled().style), props.tableStyle)}
      rowClass={joinClassNames(rowCompiled().className, props.rowClass)}
      rowStyle={mergeSolidStyles(toSolidStyle(rowCompiled().style), props.rowStyle)}
      rowSelectedClass={joinClassNames(rowSelectedCompiled().className, props.rowSelectedClass)}
      rowSelectedStyle={mergeSolidStyles(
        toSolidStyle(rowSelectedCompiled().style),
        props.rowSelectedStyle,
      )}
      headerCellClass={joinClassNames(headerCellCompiled().className, props.headerCellClass)}
      headerCellStyle={mergeSolidStyles(
        toSolidStyle(headerCellCompiled().style),
        props.headerCellStyle,
      )}
      cellClass={joinClassNames(cellCompiled().className, props.cellClass)}
      cellStyle={mergeSolidStyles(toSolidStyle(cellCompiled().style), props.cellStyle)}
      cellSelectedClass={joinClassNames(cellSelectedCompiled().className, props.cellSelectedClass)}
      cellSelectedStyle={mergeSolidStyles(
        toSolidStyle(cellSelectedCompiled().style),
        props.cellSelectedStyle,
      )}
      cellLastRowClass={joinClassNames(cellLastRowCompiled().className, props.cellLastRowClass)}
      cellLastRowStyle={mergeSolidStyles(
        toSolidStyle(cellLastRowCompiled().style),
        props.cellLastRowStyle,
      )}
      alignCenterClass={joinClassNames(alignCenterCompiled().className, props.alignCenterClass)}
      alignCenterStyle={mergeSolidStyles(
        toSolidStyle(alignCenterCompiled().style),
        props.alignCenterStyle,
      )}
      alignEndClass={joinClassNames(alignEndCompiled().className, props.alignEndClass)}
      alignEndStyle={mergeSolidStyles(toSolidStyle(alignEndCompiled().style), props.alignEndStyle)}
    />
  )
}

export type { TableColumn, StyledTableProps as TableProps }
