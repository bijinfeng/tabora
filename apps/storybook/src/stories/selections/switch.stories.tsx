import { Switch } from "@tabora/ui"
import { createSignal } from "solid-js"
import type { Meta, StoryObj } from "storybook-solidjs"

const meta = {
  title: "Selections/Switch",
  component: Switch,
  argTypes: {
    size: { control: "select", options: ["sm", "md"] },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
  },
  args: {
    size: "md",
    disabled: false,
    loading: false,
  },
} satisfies Meta<typeof Switch>

export default meta

type Story = StoryObj<typeof meta>

export const Off: Story = {
  render: (args: typeof meta.args) => {
    const [checked, setChecked] = createSignal(false)
    return <Switch {...args} checked={checked()} onChange={setChecked} label="关闭状态" />
  },
}

export const On: Story = {
  render: (args: typeof meta.args) => {
    const [checked, setChecked] = createSignal(true)
    return <Switch {...args} checked={checked()} onChange={setChecked} label="开启状态" />
  },
}

export const Loading: Story = {
  args: { loading: true },
  render: (args: typeof meta.args) => {
    const [checked, setChecked] = createSignal(true)
    return <Switch {...args} checked={checked()} onChange={setChecked} label="加载中" />
  },
}

export const Disabled: Story = {
  args: { disabled: true },
  render: (args: typeof meta.args) => {
    const [checked, setChecked] = createSignal(false)
    return <Switch {...args} checked={checked()} onChange={setChecked} label="已禁用" />
  },
}

export const SmallSize: Story = {
  args: { size: "sm" },
  render: (args: typeof meta.args) => {
    const [checked, setChecked] = createSignal(false)
    return <Switch {...args} checked={checked()} onChange={setChecked} label="小号开关" />
  },
}

export const WithoutLabel: Story = {
  render: (args: typeof meta.args) => {
    const [checked, setChecked] = createSignal(true)
    return <Switch {...args} checked={checked()} onChange={setChecked} aria-label="无标签开关" />
  },
}
