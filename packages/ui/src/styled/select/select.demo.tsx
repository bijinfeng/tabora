import { createMemo, createSignal } from "solid-js"

import { Field } from "../field"
import { Select } from "./select.styled"

const searchSourceOptions = [
  { value: "google", label: "Google" },
  { value: "github", label: "GitHub" },
  { value: "docs", label: "文档" },
] as const

const openModeOptions = [
  { value: "current", label: "当前标签页" },
  { value: "split", label: "侧边预览" },
  { value: "newtab", label: "新标签页" },
] as const

export function SelectDemo() {
  const [value, setValue] = createSignal<"google" | "github" | "docs">("google")
  const [openMode, setOpenMode] = createSignal<"current" | "split" | "newtab">("current")

  const summary = createMemo(() => {
    const sourceLabel =
      searchSourceOptions.find((option) => option.value === value())?.label ?? "Google"
    const openLabel =
      openModeOptions.find((option) => option.value === openMode())?.label ?? "当前标签页"
    return `${sourceLabel} · ${openLabel}`
  })

  return (
    <div class="docs-control-stack">
      <div class="docs-stack compact">
        <strong>默认搜索源</strong>
        <span>模拟工作区搜索配置里常见的双下拉组合。</span>
      </div>
      <Field label="默认搜索源" helper="决定 Enter 直搜时优先命中的 provider。">
        <Select
          value={value()}
          onChange={setValue}
          aria-label="默认搜索源"
          options={[...searchSourceOptions]}
        />
      </Field>
      <Field label="打开方式" helper="控制搜索结果在当前工作区中的呈现方式。">
        <Select
          value={openMode()}
          onChange={setOpenMode}
          aria-label="打开方式"
          options={[...openModeOptions]}
        />
      </Field>
      <div class="docs-stack compact">
        <span>当前配置</span>
        <strong>{summary()}</strong>
      </div>
    </div>
  )
}
