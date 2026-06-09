import { Table as Primitive } from "../../primitives/table/table"
import type { TableColumn, TableProps } from "../../primitives/table/table"
import "./styles.css"

export function Table<T>(props: TableProps<T>) {
  return <Primitive {...props} class={`tbr-table ${props.class ?? ""}`} />
}

export type { TableColumn, TableProps }
