import { VisuallyHidden } from "../../primitives/visuallyHidden"

import { demoStyles, sx } from "../demoStyles"
export function VisuallyHiddenDemo() {
  return (
    <div {...sx(demoStyles.controlStack)}>
      <div {...sx(demoStyles.stackCompact)}>
        <strong>无障碍补充说明</strong>
        <span>适合给纯图标或高度压缩的界面补上只读给辅助技术的上下文。</span>
      </div>
      <p {...sx(demoStyles.muted)}>
        下面这段文本只对辅助技术可见：
        <VisuallyHidden>这个按钮会保存当前插件设置。</VisuallyHidden>
      </p>
    </div>
  )
}
