import { RadioGroup } from "@tabora/ui"
import { createSignal } from "solid-js"
import type { Meta, StoryObj } from "storybook-solidjs"

const options = [
  { value: "1", label: "选项 A" },
  { value: "2", label: "选项 B（带描述）", description: "这是选项 B 的补充说明" },
  { value: "3", label: "选项 C（禁用）", disabled: true },
]

const meta = {
  title: "Selections/RadioGroup",
  component: RadioGroup,
  argTypes: {
    direction: { control: "select", options: ["vertical", "horizontal"] },
  },
  args: {
    direction: "vertical",
  },
} satisfies Meta<typeof RadioGroup>

export default meta

type Story = StoryObj<typeof meta>

export const Vertical: Story = {
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("1")
    return (
      <RadioGroup {...args} name="demo" value={value()} onChange={setValue} options={options} />
    )
  },
}

export const Horizontal: Story = {
  args: { direction: "horizontal" },
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("1")
    return (
      <RadioGroup {...args} name="demo" value={value()} onChange={setValue} options={options} />
    )
  },
}

export const Unselected: Story = {
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("")
    return (
      <RadioGroup {...args} name="empty" value={value()} onChange={setValue} options={options} />
    )
  },
}
