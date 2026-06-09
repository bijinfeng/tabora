import { createSignal } from "solid-js"

import { Badge } from "../badge"
import { Switch } from "../switch"
import { ListRow } from "./listRow.styled"

export function ListRowDemo() {
  const [enabled, setEnabled] = createSignal(true)

  return (
    <div class="docs-stack">
      <ListRow
        primary="Todo Widget"
        secondary="待办卡片"
        trailing={<Badge variant="success">启用</Badge>}
      />
      <ListRow
        primary="Notes Widget"
        secondary="便签卡片"
        trailing={<Switch checked={enabled()} onChange={setEnabled} aria-label="启用便签" />}
      />
    </div>
  )
}
