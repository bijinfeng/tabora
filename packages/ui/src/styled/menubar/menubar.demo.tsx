import { createSignal } from "solid-js"

import { demoStyles, sx } from "../demoStyles"
import { Badge } from "../badge"
import { Menubar } from "./menubar.styled"

export function MenubarDemo() {
  const [value, setValue] = createSignal("appearance")

  const sectionSummary = () =>
    (
      ({
        general: "管理工作区名称、默认行为和基础偏好。",
        appearance: "调整主题、背景来源和卡片密度。",
        plugins: "查看插件启用状态、权限和贡献能力。",
      }) as const
    )[value()]

  return (
    <div {...sx(demoStyles.controlStack)}>
      <div {...sx(demoStyles.stackCompact)}>
        <strong>设置导航</strong>
        <span>适合在同一上下文内切换设置分区，不需要离开当前内容面板。</span>
      </div>
      <Menubar
        aria-label="设置导航"
        value={value()}
        onChange={setValue}
        items={[
          { value: "general", label: "通用" },
          { value: "appearance", label: "外观" },
          { value: "plugins", label: "插件" },
        ]}
      />
      <div {...sx(demoStyles.row)}>
        <Badge variant="neutral">当前分区</Badge>
        <span>{sectionSummary()}</span>
      </div>
    </div>
  )
}
