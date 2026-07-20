import type { JSX } from "solid-js"
import { For } from "solid-js"

export type TableColumn<T> = {
  key: string
  header: JSX.Element
  cell: (row: T) => JSX.Element
  align?: "start" | "center" | "end"
}

export type TableProps<T> = {
  columns: TableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  selectedRowKeys?: string[]
  onRowClick?: (row: T) => void
  class?: string | undefined
  style?: JSX.CSSProperties | undefined
  tableClass?: string | undefined
  tableStyle?: JSX.CSSProperties | undefined
  rowClass?: string | undefined
  rowStyle?: JSX.CSSProperties | undefined
  rowSelectedClass?: string | undefined
  rowSelectedStyle?: JSX.CSSProperties | undefined
  headerCellClass?: string | undefined
  headerCellStyle?: JSX.CSSProperties | undefined
  cellClass?: string | undefined
  cellStyle?: JSX.CSSProperties | undefined
  cellSelectedClass?: string | undefined
  cellSelectedStyle?: JSX.CSSProperties | undefined
  cellLastRowClass?: string | undefined
  cellLastRowStyle?: JSX.CSSProperties | undefined
  alignCenterClass?: string | undefined
  alignCenterStyle?: JSX.CSSProperties | undefined
  alignEndClass?: string | undefined
  alignEndStyle?: JSX.CSSProperties | undefined
  "aria-label": string
}

export function Table<T>(props: TableProps<T>) {
  const alignClass = (align: "start" | "center" | "end" | undefined) =>
    align === "center" ? props.alignCenterClass : align === "end" ? props.alignEndClass : undefined
  const alignStyle = (align: "start" | "center" | "end" | undefined) =>
    align === "center" ? props.alignCenterStyle : align === "end" ? props.alignEndStyle : undefined

  return (
    <div class={props.class} style={props.style}>
      <table class={props.tableClass} style={props.tableStyle} aria-label={props["aria-label"]}>
        <thead>
          <tr>
            <For each={props.columns}>
              {(column) => (
                <th
                  class={[props.headerCellClass, alignClass(column.align)]
                    .filter(Boolean)
                    .join(" ")}
                  style={{ ...props.headerCellStyle, ...alignStyle(column.align) }}
                  data-align={column.align ?? "start"}
                >
                  {column.header}
                </th>
              )}
            </For>
          </tr>
        </thead>
        <tbody>
          <For each={props.rows}>
            {(row, index) => {
              const key = () => props.rowKey(row)
              const selected = () => props.selectedRowKeys?.includes(key()) ?? false
              const isLast = () => index() === props.rows.length - 1
              return (
                <tr
                  class={[props.rowClass, selected() ? props.rowSelectedClass : undefined]
                    .filter(Boolean)
                    .join(" ")}
                  style={
                    selected() ? { ...props.rowStyle, ...props.rowSelectedStyle } : props.rowStyle
                  }
                  data-selected={selected() ? "" : undefined}
                  onClick={() => props.onRowClick?.(row)}
                >
                  <For each={props.columns}>
                    {(column) => (
                      <td
                        class={[
                          props.cellClass,
                          selected() ? props.cellSelectedClass : undefined,
                          isLast() ? props.cellLastRowClass : undefined,
                          alignClass(column.align),
                        ]
                          .filter(Boolean)
                          .join(" ")}
                        style={{
                          ...props.cellStyle,
                          ...(selected() ? props.cellSelectedStyle : undefined),
                          ...(isLast() ? props.cellLastRowStyle : undefined),
                          ...alignStyle(column.align),
                        }}
                        data-align={column.align ?? "start"}
                      >
                        {column.cell(row)}
                      </td>
                    )}
                  </For>
                </tr>
              )
            }}
          </For>
        </tbody>
      </table>
    </div>
  )
}
