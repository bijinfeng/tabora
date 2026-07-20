import * as stylex from "@stylexjs/stylex"
import { Show } from "solid-js"
import type { WidgetViewProps } from "@tabora/plugin-api"
import { Button, InlineError } from "@tabora/ui"
import { useQuickLinksExpandSession } from "./quick-links-expand-session"
import { styles } from "./styles"

function footerHint(panel: "links" | "groups" | "entry"): string {
  if (panel === "groups") return "正在管理分组：调整显示状态，或新增一个入口分组。"
  if (panel === "entry") return "正在添加入口：填写链接、名称、分组和图标色后保存。"
  return "常规快捷入口管理，列表与配置区保持左右分区。"
}

export function QuickLinksExpandFooter(props: WidgetViewProps) {
  const session = useQuickLinksExpandSession(props)
  const { panel, urlError, toggleManageGroups, primaryAction } = session

  return (
    <div {...stylex.attrs(styles.footer)} data-quick-links-footer>
      <div {...stylex.attrs(styles.footerInfo)}>
        <Show
          when={urlError()}
          fallback={<span {...stylex.attrs(styles.footerHint)}>{footerHint(panel())}</span>}
        >
          <InlineError>{urlError()!}</InlineError>
        </Show>
      </div>
      <div {...stylex.attrs(styles.footerActions)}>
        <Button size="sm" variant="secondary" onClick={toggleManageGroups}>
          {panel() === "groups" ? "完成" : panel() === "entry" ? "取消" : "管理分组"}
        </Button>
        <Button size="sm" variant="primary" onClick={primaryAction}>
          {panel() === "entry" ? "保存入口" : "添加入口"}
        </Button>
      </div>
    </div>
  )
}
