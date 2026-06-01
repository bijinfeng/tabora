import { Progress } from "@tabora/ui"

export default {
  title: "Feedback/Progress",
  component: Progress,
  argTypes: {
    value: { control: "number", min: 0, max: 100 },
    max: { control: "number" },
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
  args: {
    value: 60,
    max: 100,
    size: "md",
    "aria-label": "进度",
  },
}

export const Default = {
  render: () => <Progress value={60} aria-label="进度" />,
}

export const Low = {
  render: () => <Progress value={20} aria-label="进度" />,
}

export const Complete = {
  render: () => <Progress value={100} aria-label="进度" />,
}

export const SmallSize = {
  render: () => <Progress value={45} size="sm" aria-label="进度" />,
}

export const LargeSize = {
  render: () => <Progress value={75} size="lg" aria-label="进度" />,
}
