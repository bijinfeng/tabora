import { Button, IconButton } from "@tabora/ui"
import type { Meta, StoryObj } from "storybook-solidjs"

const meta = {
  title: "Actions/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "secondary", "subtle", "ghost", "danger"],
    },
    size: { control: "select", options: ["sm", "md", "lg"] },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
    fullWidth: { control: "boolean" },
  },
  args: {
    variant: "secondary",
    size: "md",
    disabled: false,
    loading: false,
    fullWidth: false,
  },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

export const Secondary: Story = {
  render: () => <Button>次要按钮</Button>,
}

export const Primary: Story = {
  args: { variant: "primary" },
  render: () => <Button variant="primary">主要按钮</Button>,
}

export const Subtle: Story = {
  args: { variant: "subtle" },
  render: () => <Button variant="subtle">轻量按钮</Button>,
}

export const Ghost: Story = {
  args: { variant: "ghost" },
  render: () => <Button variant="ghost">幽灵按钮</Button>,
}

export const Danger: Story = {
  args: { variant: "danger" },
  render: () => <Button variant="danger">危险按钮</Button>,
}

export const Loading: Story = {
  args: { loading: true, variant: "primary" },
  render: () => (
    <Button loading variant="primary">
      加载中
    </Button>
  ),
}

export const Disabled: Story = {
  args: { disabled: true },
  render: () => <Button disabled>已禁用</Button>,
}

export const Small: Story = {
  args: { size: "sm", variant: "primary" },
  render: () => (
    <Button size="sm" variant="primary">
      小按钮
    </Button>
  ),
}

export const Large: Story = {
  args: { size: "lg" },
  render: () => <Button size="lg">大按钮</Button>,
}

export const FullWidth: Story = {
  args: { fullWidth: true, variant: "primary" },
  render: () => (
    <Button fullWidth variant="primary">
      全宽按钮
    </Button>
  ),
}

export const Icon: Story = {
  ...{
    title: "Actions/IconButton",
    component: IconButton,
    argTypes: {
      size: { control: "select", options: ["sm", "md", "lg"] },
      disabled: { control: "boolean" },
      loading: { control: "boolean" },
    },
    args: {
      size: "md",
      disabled: false,
      loading: false,
    },
  },
  render: () => (
    <IconButton aria-label="收藏">
      <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
        <path d="M8 1l2 4 4.5.7L11.2 9l.8 4.7L8 11.6 4 13.7l.8-4.7L1.5 5.7 6 5 8 1z" />
      </svg>
    </IconButton>
  ),
}
