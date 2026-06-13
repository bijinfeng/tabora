import { createSignal } from "solid-js"
import { Boxes, Search, Settings } from "lucide-solid"

import { Badge } from "../badge"
import { Tabs } from "./tabs.styled"

export function TabsDemo() {
  const [underlineValue, setUnderlineValue] = createSignal("overview")
  const [pillValue, setPillValue] = createSignal("all")
  const [iconValue, setIconValue] = createSignal("installed")

  return (
    <div class="docs-stack">
      <Tabs
        value={underlineValue()}
        onChange={setUnderlineValue}
        aria-label="默认标签页"
        tabs={[
          { value: "overview", label: "概览", content: <p>概览面板内容</p> },
          { value: "plugins", label: "插件", content: <p>插件面板内容</p> },
          { value: "settings", label: "设置", content: <p>设置面板内容</p> },
          { value: "logs", label: "日志（禁用）", content: <p>日志面板内容</p>, disabled: true },
        ]}
      />

      <Tabs
        value={pillValue()}
        onChange={setPillValue}
        variant="pills"
        aria-label="胶囊标签页"
        tabs={[
          { value: "all", label: "全部", content: <p>全部插件内容</p> },
          { value: "layout", label: "布局", content: <p>布局插件内容</p> },
          { value: "widgets", label: "小组件", content: <p>小组件内容</p> },
          { value: "search", label: "搜索", content: <p>搜索插件内容</p> },
        ]}
      />

      <Tabs
        value={iconValue()}
        onChange={setIconValue}
        aria-label="带图标与计数的标签页"
        tabs={[
          {
            value: "installed",
            label: (
              <span class="tbr-tabs-label">
                <Boxes size={16} strokeWidth={2} />
                已安装
                <Badge variant="counter" size="sm">
                  12
                </Badge>
              </span>
            ),
            content: <p>已安装插件内容</p>,
          },
          {
            value: "discover",
            label: (
              <span class="tbr-tabs-label">
                <Search size={16} strokeWidth={2} />
                发现
              </span>
            ),
            content: <p>发现插件内容</p>,
          },
          {
            value: "updates",
            label: (
              <span class="tbr-tabs-label">
                <Settings size={16} strokeWidth={2} />
                更新
                <Badge variant="counter" size="sm">
                  3
                </Badge>
              </span>
            ),
            content: <p>更新面板内容</p>,
          },
        ]}
      />
    </div>
  )
}
