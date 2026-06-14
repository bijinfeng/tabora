import { createMemo, createSignal } from "solid-js"

import { Badge } from "../badge"
import { Button } from "../button"
import { Table } from "./table.styled"

export function TableDemo() {
  const [showOnlyRunning, setShowOnlyRunning] = createSignal(true)

  const rows = createMemo(() => {
    const baseRows = [
      {
        id: "todo",
        name: "Todo",
        type: "widget",
        state: "运行中",
        activity: "2 分钟前同步",
        permission: "本地存储",
      },
      {
        id: "theme",
        name: "Theme",
        type: "theme",
        state: "启用",
        activity: "刚刚应用",
        permission: "主题 token",
      },
      {
        id: "weather",
        name: "Weather",
        type: "widget",
        state: "待授权",
        activity: "需要位置权限",
        permission: "external-open",
      },
    ]

    return showOnlyRunning()
      ? baseRows.filter((row) => row.state === "运行中" || row.state === "启用")
      : baseRows
  })

  return (
    <div class="docs-control-stack">
      <div class="docs-row">
        <strong>插件运行状态</strong>
        <Button size="sm" variant="secondary" onClick={() => setShowOnlyRunning((value) => !value)}>
          {showOnlyRunning() ? "显示全部" : "只看运行中"}
        </Button>
      </div>
      <Table
        aria-label="插件状态"
        columns={[
          { key: "name", header: "插件", cell: (row) => row.name },
          {
            key: "type",
            header: "类型",
            cell: (row) => <Badge variant="accent">{row.type}</Badge>,
          },
          { key: "state", header: "状态", cell: (row) => row.state },
          { key: "activity", header: "最近活动", cell: (row) => row.activity },
          {
            key: "permission",
            header: "权限",
            cell: (row) => <span>{row.permission}</span>,
          },
        ]}
        rows={rows()}
        rowKey={(row) => row.id}
      />
      <div class="docs-stack compact">
        <span>当前显示 {rows().length} 个插件实例。</span>
        {rows().length === 0 ? <span>没有符合筛选条件的运行实例。</span> : null}
      </div>
    </div>
  )
}
