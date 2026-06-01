import { Avatar } from "@tabora/ui"
import type { Meta, StoryObj } from "storybook-solidjs"

const meta = {
  title: "Display/Avatar",
  component: Avatar,
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg", "xl"] },
  },
  args: {
    size: "md",
    alt: "用户头像",
  },
} satisfies Meta<typeof Avatar>

export default meta

type Story = StoryObj<typeof meta>

export const WithImage: Story = {
  args: {
    src: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
  },
  render: () => (
    <Avatar
      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
      alt="用户头像"
    />
  ),
}

export const FallbackInitials: Story = {
  args: { fallback: "张三" },
  render: () => <Avatar fallback="张三" alt="用户头像" />,
}

export const FallbackUnknown: Story = {
  render: () => <Avatar alt="用户头像" />,
}

export const Small: Story = {
  args: { size: "sm", fallback: "A" },
  render: () => <Avatar size="sm" fallback="A" alt="用户头像" />,
}

export const Large: Story = {
  args: { size: "lg", fallback: "B" },
  render: () => <Avatar size="lg" fallback="B" alt="用户头像" />,
}

export const ExtraLarge: Story = {
  args: { size: "xl", fallback: "C" },
  render: () => <Avatar size="xl" fallback="C" alt="用户头像" />,
}
