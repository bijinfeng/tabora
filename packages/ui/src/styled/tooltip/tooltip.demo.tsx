import { Button } from "../button"
import { Tooltip } from "./tooltip.styled"

export function TooltipDemo() {
  return (
    <Tooltip content="打开设置">
      <Button variant="secondary">悬停查看</Button>
    </Tooltip>
  )
}
