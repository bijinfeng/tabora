import { createSignal } from "solid-js"

import { demoStyles, sx } from "../demoStyles"
import { RadioGroup } from "./radioGroup.styled"

export function RadioGroupDemo() {
  const [value, setValue] = createSignal<"cards" | "list" | "compact">("cards")

  return (
    <div {...sx(demoStyles.controlStack)}>
      <div {...sx(demoStyles.stackCompact)}>
        <strong>搜索结果布局</strong>
        <span>适合 3-5 个互斥方案，并直接展示每种方案的说明。</span>
      </div>
      <RadioGroup
        name="docs-results-layout"
        value={value()}
        onChange={setValue}
        options={[
          { value: "cards", label: "卡片布局", description: "更适合展示 rich preview" },
          { value: "list", label: "列表布局", description: "适合高密度快速扫描" },
          { value: "compact", label: "紧凑布局", description: "为窄宽度或小屏预留更多内容空间" },
        ]}
      />
      <div {...sx(demoStyles.stackCompact)}>
        <span>当前选择</span>
        <strong>
          {value() === "cards" ? "卡片布局" : value() === "list" ? "列表布局" : "紧凑布局"}
        </strong>
      </div>
    </div>
  )
}
