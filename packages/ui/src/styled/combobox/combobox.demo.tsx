import * as stylex from "@stylexjs/stylex"
import { createMemo, createSignal } from "solid-js"

import { demoStyles } from "../demoStyles"
import { Badge } from "../badge"
import { Combobox } from "./combobox.styled"

export function ComboboxDemo() {
  const [value, setValue] = createSignal("今")
  const [selectedLabel, setSelectedLabel] = createSignal("今日重点卡片")

  const options = [
    { value: "today-focus", label: "今日重点卡片" },
    { value: "todo", label: "待办列表" },
    { value: "notes", label: "便签卡片" },
    { value: "google", label: "Google 搜索" },
    { value: "perplexity", label: "Perplexity 搜索" },
    { value: "docs", label: "内部文档搜索" },
  ] as const

  const resultCount = createMemo(
    () =>
      options.filter((option) => option.label.toLowerCase().includes(value().trim().toLowerCase()))
        .length,
  )

  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>搜索插件与搜索源</strong>
        <span>适合需要边输入边筛选的大量候选项，而不是少量固定选项。</span>
      </div>
      <Combobox
        value={value()}
        onInput={setValue}
        onSelect={(option) => {
          setValue(option.label)
          setSelectedLabel(option.label)
        }}
        aria-label="搜索插件或搜索源"
        placeholder="搜索插件或搜索源..."
        options={[...options]}
      />
      <div {...stylex.attrs(demoStyles.row)}>
        <Badge variant="neutral">候选 {resultCount()}</Badge>
        <span>最近选中：{selectedLabel()}</span>
      </div>
    </div>
  )
}
