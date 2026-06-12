import { createSignal } from "solid-js"

import { Button } from "../button"
import { Progress } from "./progress.styled"

export function ProgressDemo() {
  const [value, setValue] = createSignal(60)

  return (
    <div class="docs-control-stack">
      <Progress value={value()} aria-label="导入进度" />
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
        <span>{value()}%</span>
      </div>
    </div>
  )
}
