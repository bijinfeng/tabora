import { Accordion } from "@tabora/ui"

const items = [
  {
    id: "1",
    title: "什么是 Tabora？",
    content: (
      <p style={{ margin: 0 }}>
        Tabora 是一个插件优先的个人工作台新标签页产品，由插件装配而成的模块仪表盘型工作台平台。
      </p>
    ),
  },
  {
    id: "2",
    title: "如何添加插件？",
    content: (
      <p style={{ margin: 0 }}>
        通过左侧轻 rail 的「添加卡片」按钮打开插件浏览器，选择需要的插件即可添加到工作台。
      </p>
    ),
  },
  {
    id: "3",
    title: "已禁用的项目",
    content: <p style={{ margin: 0 }}>此项目当前不可用。</p>,
    disabled: true,
  },
]

export default {
  title: "Layout/Accordion",
  component: Accordion,
  argTypes: {
    multiple: { control: "boolean" },
  },
  args: {
    multiple: false,
  },
}

export const SingleOpen = {
  render: () => <Accordion items={items} />,
}

export const MultipleOpen = {
  render: () => <Accordion items={items} multiple />,
}
