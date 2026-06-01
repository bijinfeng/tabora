import { Truncate } from "@tabora/ui"
import type { Meta, StoryObj } from "storybook-solidjs"

const meta = {
  title: "Display/Truncate",
  component: Truncate,
  argTypes: {
    lines: { control: "select", options: [1, 2, 3] },
  },
  args: {
    lines: 1,
  },
} satisfies Meta<typeof Truncate>

export default meta

type Story = StoryObj<typeof meta>

const longText =
  "这是一段很长的文本内容，用于演示截断效果。当文本超出容器宽度时，超出的部分会被截断并以省略号代替。这是一个非常实用的文字展示功能。"

export const SingleLine: Story = {
  render: () => (
    <div style={{ "max-width": "300px" }}>
      <Truncate>{longText}</Truncate>
    </div>
  ),
}

export const TwoLines: Story = {
  args: { lines: 2 },
  render: () => (
    <div style={{ "max-width": "300px" }}>
      <Truncate lines={2}>{longText + " " + longText}</Truncate>
    </div>
  ),
}

export const ThreeLines: Story = {
  args: { lines: 3 },
  render: () => (
    <div style={{ "max-width": "300px" }}>
      <Truncate lines={3}>{longText + " " + longText + " " + longText}</Truncate>
    </div>
  ),
}

export const ShortText: Story = {
  render: () => (
    <div style={{ "max-width": "300px" }}>
      <Truncate>短文本不会被截断。</Truncate>
    </div>
  ),
}
