import { createSignal } from "solid-js"

import { Select } from "./select.styled"
import "./select.demo.css"

const engineOptions = [
  { value: "google", label: "Google" },
  { value: "bing", label: "Bing" },
  { value: "ddg", label: "DuckDuckGo" },
  { value: "perplexity", label: "Perplexity" },
  { value: "kagi", label: "Kagi" },
] as const

const openModeOptions = [
  { value: "current", label: "当前标签页" },
  { value: "newtab", label: "新标签页" },
  { value: "external", label: "外部浏览器" },
] as const

export function SelectDemo() {
  const [singleValue, setSingleValue] = createSignal<
    "google" | "bing" | "ddg" | "perplexity" | "kagi"
  >("bing")

  const [openMode, setOpenMode] = createSignal<"current" | "newtab" | "external">("newtab")

  const [multiValue, setMultiValue] = createSignal<
    ("google" | "bing" | "ddg" | "perplexity" | "kagi")[]
  >(["google", "bing"])

  const [smallValue, setSmallValue] = createSignal<
    "google" | "bing" | "ddg" | "perplexity" | "kagi"
  >("google")

  const [invalidValue, setInvalidValue] = createSignal<
    "google" | "bing" | "ddg" | "perplexity" | "kagi"
  >("google")

  return (
    <div class="docs-control-stack">
      <div class="demo-section">
        <h4>默认搜索源</h4>
        <div class="demo-row">
          <Select
            value={singleValue()}
            onChange={setSingleValue}
            options={[...engineOptions]}
            placeholder="选择默认搜索源"
            aria-label="单选示例"
          />
        </div>
      </div>

      <div class="demo-section">
        <h4>打开方式</h4>
        <div class="demo-row">
          <Select
            value={openMode()}
            onChange={setOpenMode}
            options={[...openModeOptions]}
            placeholder="选择打开方式"
            aria-label="打开方式示例"
          />
        </div>
      </div>

      <div class="demo-section">
        <h4>多选标签模式</h4>
        <div class="demo-row">
          <div style={{ width: "320px" }}>
            <Select
              value={multiValue()}
              onChange={setMultiValue}
              options={[...engineOptions]}
              multiple
              placeholder="选择多个..."
              maxVisibleTags={3}
              aria-label="多选示例"
            />
          </div>
        </div>
      </div>

      <div class="demo-section">
        <h4>尺寸与状态</h4>
        <div class="demo-row">
          <Select
            value={smallValue()}
            onChange={setSmallValue}
            options={[...engineOptions]}
            size="sm"
            placeholder="小尺寸"
            aria-label="小尺寸示例"
          />
          <Select
            value={singleValue()}
            onChange={setSingleValue}
            options={[...engineOptions]}
            placeholder="默认尺寸"
            aria-label="默认尺寸示例"
          />
          <Select
            value={invalidValue()}
            onChange={setInvalidValue}
            options={[...engineOptions]}
            invalid
            placeholder="校验失败"
            aria-label="校验失败示例"
          />
          <Select
            value="google"
            onChange={() => {}}
            options={[...engineOptions]}
            disabled
            placeholder="已禁用"
            aria-label="禁用示例"
          />
        </div>
      </div>
    </div>
  )
}
