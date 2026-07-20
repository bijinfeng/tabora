import * as stylex from "@stylexjs/stylex"
import { Badge } from "../badge"
import { Spinner } from "./spinner.styled"

import { demoStyles } from "../demoStyles"
export function SpinnerDemo() {
  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>插件同步中</strong>
        <span>短时加载更适合用 Spinner，而不是完整骨架屏。</span>
      </div>
      <div {...stylex.attrs(demoStyles.row)}>
        <Spinner size="sm" />
        <Spinner />
        <Spinner size="lg" />
        <Badge variant="accent">短时操作</Badge>
      </div>
      <span {...stylex.attrs(demoStyles.inlineStatus)}>
        <Spinner size="sm" />
        加载中...
      </span>
    </div>
  )
}
