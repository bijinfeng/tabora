import { createSignal } from "solid-js"

import { TreeView } from "./treeView.styled"

export function TreeViewDemo() {
  const [expanded, setExpanded] = createSignal(["root"])
  const [selected, setSelected] = createSignal("manifest")

  return (
    <TreeView
      aria-label="插件文件"
      items={[
        {
          id: "root",
          label: "official.widget.todo",
          children: [
            { id: "manifest", label: "manifest.json" },
            { id: "view", label: "todo-card.tsx" },
          ],
        },
      ]}
      expandedIds={expanded()}
      onExpandedChange={setExpanded}
      selectedId={selected()}
      onSelect={setSelected}
    />
  )
}
