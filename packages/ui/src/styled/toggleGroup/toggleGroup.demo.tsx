import { createSignal } from "solid-js"

import { demoStyles, sx } from "../demoStyles"
import { Badge } from "../badge"
import { ToggleGroup } from "./toggleGroup.styled"

export function ToggleGroupDemo() {
  const [value, setValue] = createSignal(["mon", "wed"])

  return (
    <div {...sx(demoStyles.controlStack)}>
      <div {...sx(demoStyles.stackCompact)}>
        <strong>每周工作日</strong>
        <span>适合多选节律配置，比如同步日期、提醒周期和过滤标签。</span>
      </div>
      <ToggleGroup
        value={value()}
        onChange={setValue}
        aria-label="每周工作日"
        options={[
          { value: "mon", label: "周一" },
          { value: "tue", label: "周二" },
          { value: "wed", label: "周三" },
          { value: "thu", label: "周四" },
          { value: "fri", label: "周五" },
        ]}
      />
      <div {...sx(demoStyles.row)}>
        <Badge variant="neutral">已选 {value().length} 天</Badge>
        <span>{value().join(" / ")}</span>
      </div>
    </div>
  )
}
