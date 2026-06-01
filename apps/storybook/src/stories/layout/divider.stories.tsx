import { Divider } from "@tabora/ui"

export default {
  title: "Layout/Divider",
  component: Divider,
  argTypes: {
    orientation: { control: "select", options: ["horizontal", "vertical"] },
  },
  args: {
    orientation: "horizontal",
  },
}

export const Horizontal = {
  render: () => <Divider orientation="horizontal" />,
}

export const Vertical = {
  render: () => (
    <div style={{ display: "flex", height: "60px", "align-items": "center", gap: "12px" }}>
      <span>左侧</span>
      <Divider orientation="vertical" />
      <span>右侧</span>
    </div>
  ),
}
