import * as stylex from "@stylexjs/stylex"
import { Button } from "../button"
import { InlineError } from "./inlineError.styled"

import { demoStyles } from "../demoStyles"
export function InlineErrorDemo() {
  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>同步错误提示</strong>
        <span>适合局部失败场景，提示问题并给出单个直接动作。</span>
      </div>
      <InlineError>
        布局同步失败，请检查本地存储权限。
        <Button size="sm" variant="danger-subtle">
          重试
        </Button>
      </InlineError>
    </div>
  )
}
