import { createSignal } from "solid-js"

import { Badge } from "../badge"
import { TreeView } from "./treeView.styled"

export function TreeViewDemo() {
  const [expanded, setExpanded] = createSignal(["root"])
  const [selected, setSelected] = createSignal("manifest")

  return (
    <div class="docs-control-stack">
      <div class="docs-stack compact">
        <strong>插件文件</strong>
        <span>适合展示插件贡献结构、文件树或文档章节，不需要跳出当前面板。</span>
      </div>
      <TreeView
        aria-label="插件文件"
        items={[
          {
            id: "root",
            label: "official.widget.todo",
            children: [
              { id: "manifest", label: "manifest.json" },
              { id: "view", label: "todo-card.tsx" },
              { id: "settings", label: "settings-panel.tsx" },
            ],
          },
        ]}
        expandedIds={expanded()}
        onExpandedChange={setExpanded}
        selectedId={selected()}
        onSelect={setSelected}
      />
      <div class="docs-row">
        <Badge variant="accent">已选中文件</Badge>
        <span>{selected()}</span>
      </div>
    </div>
  )
}
