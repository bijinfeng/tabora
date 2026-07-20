import * as stylex from "@stylexjs/stylex"
import { Divider } from "./divider.styled"

import { demoStyles } from "../demoStyles"
export function DividerDemo() {
  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>设置分组分隔</strong>
        <span>用弱分隔把同一块里的不同信息区间切开，而不是增加多层边框。</span>
      </div>
      <div {...stylex.attrs(demoStyles.stack)}>
        <span>搜索源配置</span>
        <Divider />
        <span>快捷键偏好</span>
      </div>
    </div>
  )
}
