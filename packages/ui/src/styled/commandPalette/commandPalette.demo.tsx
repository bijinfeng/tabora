import { createSignal } from "solid-js"

import { CommandPalette } from "./commandPalette.styled"

export function CommandPaletteDemo() {
  const [query, setQuery] = createSignal("")

  return (
    <CommandPalette
      open
      query={query()}
      onQueryChange={setQuery}
      onSelect={() => {}}
      groups={[
        {
          label: "命令",
          items: [
            {
              id: "settings",
              label: "打开设置",
              description: "管理主题和搜索源",
              shortcut: "Ctrl+,",
            },
            { id: "add", label: "添加卡片", description: "打开卡片库" },
          ],
        },
        {
          label: "卡片",
          items: [{ id: "todo", label: "待办列表", description: "管理当前任务" }],
        },
      ]}
    />
  )
}
