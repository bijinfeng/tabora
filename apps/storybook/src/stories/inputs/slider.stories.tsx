import { Slider } from "@tabora/ui"
import { createSignal } from "solid-js"
import type { Meta, StoryObj } from "storybook-solidjs"

const meta = {
  title: "Inputs/Slider",
  component: Slider,
  argTypes: {
    min: { control: "number" },
    max: { control: "number" },
    step: { control: "number" },
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    "aria-label": "滑块",
  },
} satisfies Meta<typeof Slider>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal(50)
    return <Slider {...args} value={value()} onChange={setValue} />
  },
}

export const LowValue: Story = {
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal(10)
    return <Slider {...args} value={value()} onChange={setValue} />
  },
}

export const HighValue: Story = {
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal(90)
    return <Slider {...args} value={value()} onChange={setValue} />
  },
}

export const CustomRange: Story = {
  args: { min: -50, max: 50, step: 5 },
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal(0)
    return <Slider {...args} value={value()} onChange={setValue} />
  },
}

export const Step10: Story = {
  args: { step: 10 },
  render: (args: typeof meta.args) => {
    const [value, setValue] = createSignal(50)
    return <Slider {...args} value={value()} onChange={setValue} />
  },
}
