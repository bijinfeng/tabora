import * as stylex from "@stylexjs/stylex"
import { Button } from "../button"
import { Tooltip } from "./tooltip.styled"

import { demoStyles } from "../demoStyles"
export function TooltipDemo() {
  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>图标与工具按钮提示</strong>
        <span>适合补充紧凑按钮语义，而不是承载复杂交互。</span>
      </div>
      <div {...stylex.attrs(demoStyles.row)}>
        <Tooltip content="打开插件设置">
          <Button variant="secondary">设置</Button>
        </Tooltip>
        <Tooltip content="切换为紧凑布局" placement="bottom">
          <Button variant="ghost">布局</Button>
        </Tooltip>
      </div>
    </div>
  )
}
