import { EmptyState } from "@tabora/ui"

export default {
  title: "Feedback/EmptyState",
  component: EmptyState,
  argTypes: {
    compact: { control: "boolean" },
  },
  args: {
    compact: false,
    title: "暂无数据",
    description: "当前没有任何内容，可以点击下方按钮添加。",
  },
}

export const Default = {
  render: () => (
    <EmptyState title="暂无数据" description="当前没有任何内容，可以点击下方按钮添加。" />
  ),
}

export const WithAction = {
  render: () => (
    <EmptyState
      title="暂无书签"
      description="您的书签列表为空，赶快添加第一个吧。"
      action={<button class="tbr-btn tbr-btn--primary tbr-btn--md">添加书签</button>}
    />
  ),
}

export const Compact = {
  render: () => <EmptyState compact title="无结果" description="没有找到匹配的内容。" />,
}

export const TitleOnly = {
  render: () => <EmptyState title="一切就绪" />,
}
