import { Input } from "@tabora/ui"
import { createSignal } from "solid-js"
import type { Meta, StoryObj } from "storybook-solidjs"

const meta = {
  title: "Inputs/Input",
  component: Input,
  argTypes: {
    size: { control: "select", options: ["sm", "md"] },
    type: { control: "select", options: ["text", "search", "url", "email"] },
    disabled: { control: "boolean" },
    invalid: { control: "boolean" },
  },
  args: {
    size: "md",
    type: "text",
    disabled: false,
    invalid: false,
    placeholder: "请输入内容",
  },
} satisfies Meta<typeof Input>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("")
    return <Input {...args} value={value()} onInput={setValue} />
  },
}

export const WithValue: Story = {
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("已输入的内容")
    return <Input {...args} value={value()} onInput={setValue} />
  },
}

export const Invalid: Story = {
  args: { invalid: true },
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("错误输入")
    return <Input {...args} value={value()} onInput={setValue} />
  },
}

export const Disabled: Story = {
  args: { disabled: true },
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("已禁用")
    return <Input {...args} value={value()} onInput={setValue} />
  },
}

export const SearchType: Story = {
  args: { type: "search", placeholder: "搜索..." },
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("")
    return <Input {...args} value={value()} onInput={setValue} />
  },
}

export const SmallSize: Story = {
  args: { size: "sm", placeholder: "小号输入框" },
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("")
    return <Input {...args} value={value()} onInput={setValue} />
  },
}
