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
  class?: string
  "aria-label": string
}

export function Table<T>(props: TableProps<T>) {
  return (
    <div class={props.class}>
      <table class="tbr-table-table" aria-label={props["aria-label"]}>
        <thead>
          <tr>
            <For each={props.columns}>
              {(column) => <th data-align={column.align ?? "start"}>{column.header}</th>}
            </For>
          </tr>
        </thead>
        <tbody>
          <For each={props.rows}>
            {(row) => {
              const key = () => props.rowKey(row)
              const selected = () => props.selectedRowKeys?.includes(key()) ?? false
              return (
                <tr
                  data-selected={selected() ? "" : undefined}
                  onClick={() => props.onRowClick?.(row)}
                >
                  <For each={props.columns}>
                    {(column) => <td data-align={column.align ?? "start"}>{column.cell(row)}</td>}
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
