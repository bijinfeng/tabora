import { Checkbox } from "@tabora/ui"
import { createSignal } from "solid-js"
import type { Meta, StoryObj } from "storybook-solidjs"

const meta = {
  title: "Selections/Checkbox",
  component: Checkbox,
  argTypes: {
    disabled: { control: "boolean" },
  },
  args: {
    disabled: false,
  },
} satisfies Meta<typeof Checkbox>

export default meta

type Story = StoryObj<typeof meta>

export const Unchecked: Story = {
  render: (args: typeof meta.args) => {
    const [checked, setChecked] = createSignal(false)
    return <Checkbox {...args} checked={checked()} onChange={setChecked} label="未选中" />
  },
}

export const Checked: Story = {
  render: (args: typeof meta.args) => {
    const [checked, setChecked] = createSignal(true)
    return <Checkbox {...args} checked={checked()} onChange={setChecked} label="已选中" />
  },
}

export const Indeterminate: Story = {
  render: (args: typeof meta.args) => (
    <Checkbox {...args} checked="indeterminate" onChange={() => {}} label="部分选中" />
  ),
}

export const Disabled: Story = {
  render: (args: typeof meta.args) => (
    <Checkbox {...args} checked={false} onChange={() => {}} disabled label="已禁用" />
  ),
}

export const WithoutLabel: Story = {
  render: (args: typeof meta.args) => {
    const [checked, setChecked] = createSignal(true)
    return (
      <Checkbox {...args} checked={checked()} onChange={setChecked} aria-label="无标签复选框" />
    )
  },
}
