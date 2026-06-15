import { createSignal } from "solid-js"

import { Badge } from "../badge"
import { Switch } from "../switch"
import { ListRow } from "./listRow.styled"

export function ListRowDemo() {
  const [enabled, setEnabled] = createSignal(true)

  return (
    <div class="docs-control-stack">
      <div class="docs-stack compact">
        <strong>插件设置列表</strong>
        <span>适合密集展示设置项、插件状态和对应的快捷操作。</span>
      </div>
      <div class="docs-stack">
        <ListRow
          primary="Todo Widget"
          secondary="待办卡片，支持多实例与完成态隔离。"
          trailing={<Badge variant="success">启用</Badge>}
        />
        <ListRow
          primary="Notes Widget"
          secondary="便签卡片，适合草稿与临时记录。"
          trailing={<Switch checked={enabled()} onChange={setEnabled} aria-label="启用便签" />}
        />
      </div>
    </div>
  )
}
