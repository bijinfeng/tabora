import * as stylex from "@stylexjs/stylex"
import { Chip } from "./chip.styled"

import { demoStyles } from "../demoStyles"
export function ChipDemo() {
  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>当前筛选标签</strong>
        <span>适合展示已生效的过滤条件、工作区标签和插件分类。</span>
      </div>
      <div {...stylex.attrs(demoStyles.row)}>
        <Chip selected>官方插件</Chip>
        <Chip selected>已启用</Chip>
        <Chip removable onRemove={() => {}}>
          可移除筛选
        </Chip>
      </div>
    </div>
  )
}
