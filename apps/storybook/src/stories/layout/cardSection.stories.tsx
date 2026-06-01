import { CardSection } from "@tabora/ui"

export default {
  title: "Layout/CardSection",
  component: CardSection,
  args: {
    padded: true,
  },
}

export const Padded = {
  render: () => (
    <CardSection
      padded
      title="基本信息"
      trailing={<span style={{ color: "var(--tbr-color-text-muted)" }}>必填</span>}
    >
      <p style={{ margin: 0 }}>这是卡片内容区域，已应用默认内边距。</p>
    </CardSection>
  ),
}

export const WithoutPadding = {
  render: () => (
    <CardSection padded={false} title="无边距区域">
      <div style={{ background: "var(--tbr-color-accent-soft)", padding: "8px" }}>
        此区域无边距包裹，内容直接贴边。
      </div>
    </CardSection>
  ),
}

export const NoTitle = {
  render: () => (
    <CardSection>
      <p style={{ margin: 0 }}>此卡片内容区没有标题，直接展示内容。适用于不需要明确分区的场景。</p>
    </CardSection>
  ),
}

export const TitleOnly = {
  render: () => <CardSection title="仅标题">{null}</CardSection>,
}
