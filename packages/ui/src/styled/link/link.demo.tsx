import { Badge } from "../badge"
import { Link } from "./link.styled"

import { demoStyles, sx } from "../demoStyles"
export function LinkDemo() {
  return (
    <div {...sx(demoStyles.controlStack)}>
      <div {...sx(demoStyles.stackCompact)}>
        <strong>文档与权限入口</strong>
        <span>适合串起内部文档、外部资料和低强调度的辅助跳转。</span>
      </div>
      <div {...sx(demoStyles.row)}>
        <Link href="/docs">内部文档</Link>
        <Link href="https://example.com" external>
          权限说明
        </Link>
        <Link href="/docs" muted>
          更多细节
        </Link>
      </div>
      <div {...sx(demoStyles.row)}>
        <Badge variant="neutral">external-open</Badge>
      </div>
    </div>
  )
}
