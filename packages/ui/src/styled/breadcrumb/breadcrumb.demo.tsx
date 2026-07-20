import * as stylex from "@stylexjs/stylex"
import { Breadcrumb } from "./breadcrumb.styled"

import { demoStyles } from "../demoStyles"
export function BreadcrumbDemo() {
  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>设置路径</strong>
        <span>适合在深层设置或文档结构里帮助用户确认当前位置。</span>
      </div>
      <Breadcrumb
        items={[
          { label: "工作台", href: "/" },
          { label: "设置" },
          { label: "外观", current: true },
        ]}
      />
    </div>
  )
}
