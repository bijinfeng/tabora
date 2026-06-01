import { Tabs } from "@tabora/ui"
import { createSignal } from "solid-js"

const tabs = [
  { value: "1", label: "基本信息", content: <p>基本信息面板内容</p> },
  { value: "2", label: "高级设置", content: <p>高级设置面板内容</p> },
  { value: "3", label: "关于", content: <p>关于此应用的信息</p> },
]

export default {
  title: "Navigation/Tabs",
  component: Tabs,
  argTypes: {
    variant: { control: "select", options: ["underline", "pills"] },
    size: { control: "select", options: ["sm", "md"] },
  },
  args: {
    variant: "underline",
    size: "md",
  },
}

export const Underline = {
  render: () => {
    const [value, setValue] = createSignal("1")
    return (
      <Tabs
        value={value()}
        onChange={setValue}
        tabs={tabs}
        variant="underline"
        size="md"
        aria-label="设置选项"
      />
    )
  },
}

export const Pills = {
  render: () => {
    const [value, setValue] = createSignal("1")
    return (
      <Tabs
        value={value()}
        onChange={setValue}
        tabs={tabs}
        variant="pills"
        size="md"
        aria-label="设置选项"
      />
    )
  },
}

export const SmallSize = {
  render: () => {
    const [value, setValue] = createSignal("1")
    return (
      <Tabs
        value={value()}
        onChange={setValue}
        tabs={tabs}
        variant="underline"
        size="sm"
        aria-label="设置选项"
      />
    )
  },
}

export const TwoTabs = {
  render: () => {
    const [value, setValue] = createSignal("a")
    return (
      <Tabs
        value={value()}
        onChange={setValue}
        tabs={[
          { value: "a", label: "列表", content: <p>列表视图内容</p> },
          { value: "b", label: "网格", content: <p>网格视图内容</p> },
        ]}
        variant="underline"
        size="md"
        aria-label="视图切换"
      />
    )
  },
}
