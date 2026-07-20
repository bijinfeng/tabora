import * as stylex from "@stylexjs/stylex"
import { Badge } from "../badge"
import { Link } from "./link.styled"

import { demoStyles } from "../demoStyles"
export function LinkDemo() {
  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>文档与权限入口</strong>
        <span>适合串起内部文档、外部资料和低强调度的辅助跳转。</span>
      </div>
      <div {...stylex.attrs(demoStyles.row)}>
        <Link href="/docs">内部文档</Link>
        <Link href="https://example.com" external>
          权限说明
        </Link>
        <Link href="/docs" muted>
          更多细节
        </Link>
      </div>
      <div {...stylex.attrs(demoStyles.row)}>
        <Badge variant="neutral">external-open</Badge>
      </div>
    </div>
  )
}
