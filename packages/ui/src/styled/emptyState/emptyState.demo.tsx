import * as stylex from "@stylexjs/stylex"
import { Button } from "../button"
import { EmptyState } from "./emptyState.styled"

import { demoStyles } from "../demoStyles"
export function EmptyStateDemo() {
  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>固定卡片区域</strong>
        <span>空状态不只告诉用户“没有内容”，还要给出下一步动作。</span>
      </div>
      <EmptyState
        title="暂时没有固定卡片"
        description="将常用 widget 固定到首页后，这里会始终保留它们，方便每天快速进入。"
        action={<Button size="sm">添加固定卡片</Button>}
      />
    </div>
  )
}
