import { SegmentedControl } from "@tabora/ui"
import { createSignal } from "solid-js"
import type { Meta, StoryObj } from "storybook-solidjs"

const options = [
  { value: "day", label: "日" },
  { value: "week", label: "周" },
  { value: "month", label: "月" },
]

const meta = {
  title: "Selections/SegmentedControl",
  component: SegmentedControl,
  argTypes: {
    size: { control: "select", options: ["sm", "md"] },
  },
  args: {
    size: "md",
  },
} satisfies Meta<typeof SegmentedControl>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("day")
    return (
      <SegmentedControl
        {...args}
        value={value()}
        onChange={setValue}
        options={options}
        aria-label="时间范围"
      />
    )
  },
}

export const SmallSize: Story = {
  args: { size: "sm" },
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("day")
    return (
      <SegmentedControl
        {...args}
        value={value()}
        onChange={setValue}
        options={options}
        aria-label="时间范围"
      />
    )
  },
}

export const TwoOptions: Story = {
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("a")
    return (
      <SegmentedControl
        {...args}
        value={value()}
        onChange={setValue}
        options={[
          { value: "a", label: "列表" },
          { value: "b", label: "网格" },
        ]}
        aria-label="视图模式"
      />
    )
  },
}
