import { Textarea } from "@tabora/ui"
import { createSignal } from "solid-js"
import type { Meta, StoryObj } from "storybook-solidjs"

const meta = {
  title: "Inputs/Textarea",
  component: Textarea,
  argTypes: {
    size: { control: "select", options: ["sm", "md"] },
    rows: { control: "number" },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    invalid: { control: "boolean" },
  },
  args: {
    size: "md",
    rows: 4,
    disabled: false,
    readOnly: false,
    invalid: false,
    placeholder: "请输入多行文本",
  },
} satisfies Meta<typeof Textarea>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("")
    return <Textarea {...args} value={value()} onInput={setValue} />
  },
}

export const WithValue: Story = {
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("这是已输入的多行文本内容。\n第二行文字。\n第三行文字。")
    return <Textarea {...args} value={value()} onInput={setValue} />
  },
}

export const Invalid: Story = {
  args: { invalid: true },
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("包含错误的内容")
    return <Textarea {...args} value={value()} onInput={setValue} />
  },
}

export const Disabled: Story = {
  args: { disabled: true },
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("已禁用的文本域")
    return <Textarea {...args} value={value()} onInput={setValue} />
  },
}

export const ReadOnly: Story = {
  args: { readOnly: true },
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal("只读内容，不可编辑")
    return <Textarea {...args} value={value()} onInput={setValue} />
  },
}
