import { Badge } from "../badge"
import { Table } from "./table.styled"

export function TableDemo() {
  return (
    <Table
      aria-label="插件状态"
      columns={[
        { key: "name", header: "插件", cell: (row) => row.name },
        { key: "type", header: "类型", cell: (row) => <Badge variant="accent">{row.type}</Badge> },
        { key: "state", header: "状态", cell: (row) => row.state },
      ]}
      rows={[
        { id: "todo", name: "Todo", type: "widget", state: "运行中" },
        { id: "theme", name: "Theme", type: "theme", state: "启用" },
      ]}
      rowKey={(row) => row.id}
    />
  )
}
