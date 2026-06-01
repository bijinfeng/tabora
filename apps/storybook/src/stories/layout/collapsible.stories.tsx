import { Collapsible } from "@tabora/ui"

export default {
  title: "Layout/Collapsible",
  component: Collapsible,
  args: {
    title: "高级设置",
  },
}

export const Closed = {
  render: () => (
    <Collapsible title="高级设置">
      <p style={{ margin: 0, padding: "8px" }}>折叠区域的隐藏内容，点击标题展开。</p>
    </Collapsible>
  ),
}

export const OpenInitially = {
  render: () => (
    <Collapsible title="高级设置" open>
      <p style={{ margin: 0, padding: "8px" }}>
        此区域初始为展开状态，适合需要默认显示高级选项的场景。
      </p>
    </Collapsible>
  ),
}

export const LongContent = {
  render: () => (
    <Collapsible title="配置详情">
      <div style={{ padding: "8px" }}>
        <p style={{ margin: 0, "margin-bottom": "8px" }}>
          这是一段较长的配置说明内容，用于演示折叠组件如何处理大量文本。
        </p>
        <p style={{ margin: 0, "margin-bottom": "8px" }}>配置项1: 启用自动保存功能。</p>
        <p style={{ margin: 0, "margin-bottom": "8px" }}>配置项2: 设置默认搜索源为通用搜索。</p>
        <p style={{ margin: 0 }}>配置项3: 开启主题自动切换。</p>
      </div>
    </Collapsible>
  ),
}
