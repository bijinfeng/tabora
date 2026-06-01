import { CopyButton } from "@tabora/ui"
import type { Meta, StoryObj } from "storybook-solidjs"

const meta = {
  title: "Actions/CopyButton",
  component: CopyButton,
  args: {
    value: "https://tabora.dev/share/abc123",
  },
} satisfies Meta<typeof CopyButton>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args: typeof meta.args) => <CopyButton {...args} />,
}

export const CustomChildren: Story = {
  args: { value: "npm install @tabora/ui" },
  render: (args: typeof meta.args) => <CopyButton {...args}>复制命令</CopyButton>,
}
