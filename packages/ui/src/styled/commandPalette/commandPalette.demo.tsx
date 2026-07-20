import { createSignal } from "solid-js"

import { demoStyles, sx } from "../demoStyles"
import { Badge } from "../badge"
import { CommandPalette } from "./commandPalette.styled"

export function CommandPaletteDemo() {
  const [query, setQuery] = createSignal("今")
  const [lastAction, setLastAction] = createSignal("最近执行：打开工作区设置")

  return (
    <div {...sx(demoStyles.controlStack)}>
      <div {...sx(demoStyles.stackCompact)}>
        <strong>工作台命令中心</strong>
        <span>把命令、卡片和搜索源放进同一入口，方便键盘优先的快速流转。</span>
      </div>
      <div {...sx(demoStyles.row)}>
        <Badge variant="neutral">⌘K</Badge>
        <span>{lastAction()}</span>
      </div>
      <CommandPalette
        open
        query={query()}
        onQueryChange={setQuery}
        onSelect={(id) => setLastAction(`最近执行：${id}`)}
        groups={[
          {
            label: "命令",
            items: [
              {
                id: "打开设置",
                label: "打开设置",
                description: "管理主题和搜索源",
                shortcut: "Ctrl+,",
              },
              { id: "添加卡片", label: "添加卡片", description: "打开卡片库" },
            ],
          },
          {
            label: "卡片",
            items: [
              {
                id: "添加今日重点卡片",
                label: "今日重点卡片",
                description: "把今日优先任务固定到首屏",
              },
              { id: "打开待办列表", label: "待办列表", description: "管理当前任务" },
            ],
          },
          {
            label: "搜索源",
            items: [
              { id: "切换到 Google 搜索", label: "Google 搜索", description: "默认网页搜索" },
              {
                id: "切换到内部文档搜索",
                label: "内部文档搜索",
                description: "优先搜索团队文档与插件说明",
              },
            ],
          },
        ]}
      />
    </div>
  )
}
