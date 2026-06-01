import { Badge } from "@tabora/ui"
import type { Meta, StoryObj } from "storybook-solidjs"

const meta = {
  title: "Display/Badge",
  component: Badge,
  argTypes: {
    variant: {
      control: "select",
      options: ["neutral", "accent", "success", "warning", "danger", "counter", "dot"],
    },
    size: {
      control: "select",
      options: ["sm", "md"],
    },
  },
  args: {
    variant: "neutral",
    size: "md",
  },
} satisfies Meta<typeof Badge>

export default meta

type Story = StoryObj<typeof meta>

export const Neutral: Story = {
  render: (args: typeof meta.args) => <Badge {...args}>中性</Badge>,
}

export const Accent: Story = {
  args: { variant: "accent" },
  render: (args: typeof meta.args) => <Badge {...args}>强调</Badge>,
}

export const Success: Story = {
  args: { variant: "success" },
  render: (args: typeof meta.args) => <Badge {...args}>成功</Badge>,
}

export const Warning: Story = {
  args: { variant: "warning" },
  render: (args: typeof meta.args) => <Badge {...args}>警告</Badge>,
}

export const Danger: Story = {
  args: { variant: "danger" },
  render: (args: typeof meta.args) => <Badge {...args}>危险</Badge>,
}

export const Counter: Story = {
  args: { variant: "counter" },
  render: (args: typeof meta.args) => <Badge {...args}>42</Badge>,
}

export const Dot: Story = {
  args: { variant: "dot" },
  render: (args: typeof meta.args) => <Badge {...args} />,
}

export const Small: Story = {
  args: { size: "sm" },
  render: (args: typeof meta.args) => <Badge {...args}>小</Badge>,
}
