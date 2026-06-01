import { Chip } from "@tabora/ui"
import type { Meta, StoryObj } from "storybook-solidjs"

const meta = {
  title: "Display/Chip",
  component: Chip,
  args: {
    children: "标签",
    selected: false,
    removable: false,
  },
} satisfies Meta<typeof Chip>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => <Chip>普通标签</Chip>,
}

export const Selected: Story = {
  render: () => <Chip selected>已选中</Chip>,
}

export const Removable: Story = {
  render: () => (
    <Chip removable onRemove={() => {}}>
      可移除
    </Chip>
  ),
}

export const SelectedRemovable: Story = {
  render: () => (
    <Chip selected removable onRemove={() => {}}>
      已选可移除
    </Chip>
  ),
}
