import { createSignal } from "solid-js"

import { Button } from "../button"
import { Progress } from "./progress.styled"

export function ProgressDemo() {
  const [value, setValue] = createSignal(60)

  return (
    <div class="docs-control-stack">
      <div class="docs-stack compact">
        <strong>导入插件包</strong>
        <span>适合确定进度任务，并在进度条附近同时给出阶段说明。</span>
      </div>
      <Progress value={value()} aria-label="导入插件包进度" />
      <div class="docs-row compact">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setValue((current) => Math.max(0, current - 20))}
        >
          -20%
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setValue((current) => Math.min(100, current + 20))}
        >
          +20%
        </Button>
        <span>
          {value()}% ·
          {value() < 40 ? " 校验 manifest" : value() < 80 ? " 写入本地数据" : " 完成收尾"}
        </span>
      </div>
    </div>
  )
}
