import { Select } from "@tabora/ui"
import { createSignal } from "solid-js"
import type { Meta, StoryObj } from "storybook-solidjs"

const options = [
  { value: "1", label: "选项一" },
  { value: "2", label: "选项二" },
  { value: "3", label: "选项三（禁用）", disabled: true },
  { value: "4", label: "选项四" },
]

const meta = {
  title: "Inputs/Select",
  component: Select,
  argTypes: {
    size: { control: "select", options: ["sm", "md"] },
    disabled: { control: "boolean" },
    invalid: { control: "boolean" },
  },
  args: {
    size: "md",
    disabled: false,
    invalid: false,
    placeholder: "请选择",
    options,
  },
} satisfies Meta<typeof Select>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("")
    return <Select {...args} value={value()} onChange={setValue} options={options} />
  },
}

export const WithValue: Story = {
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("2")
    return <Select {...args} value={value()} onChange={setValue} options={options} />
  },
}

export const Invalid: Story = {
  args: { invalid: true },
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("")
    return <Select {...args} value={value()} onChange={setValue} options={options} />
  },
}

export const Disabled: Story = {
  args: { disabled: true },
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("1")
    return <Select {...args} value={value()} onChange={setValue} options={options} />
  },
}

export const SmallSize: Story = {
  args: { size: "sm" },
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("")
    return <Select {...args} value={value()} onChange={setValue} options={options} />
  },
}
