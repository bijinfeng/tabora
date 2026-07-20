import * as stylex from "@stylexjs/stylex"
import { Badge } from "../badge"
import { Collapsible } from "./collapsible.styled"

import { demoStyles } from "../demoStyles"
export function CollapsibleDemo() {
  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>高级同步策略</strong>
        <span>把低频但重要的配置收起来，默认不打断主设置流程。</span>
      </div>
      <Collapsible title="高级设置" open>
        <div {...stylex.attrs(demoStyles.stackCompact)}>
          <div {...stylex.attrs(demoStyles.row)}>
            <Badge variant="warning">低频调整</Badge>
            <span>失败重试次数：3</span>
          </div>
          <p {...stylex.attrs(demoStyles.muted)}>
            这里展示低频配置项，比如超时阈值、失败回退和同步节流。
          </p>
        </div>
      </Collapsible>
    </div>
  )
}
