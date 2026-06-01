import { Spinner } from "@tabora/ui"

export default {
  title: "Feedback/Spinner",
  component: Spinner,
  argTypes: {
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
  args: {
    size: "md",
  },
}

export const Small = {
  render: () => <Spinner size="sm" />,
}

export const Medium = {
  render: () => <Spinner size="md" />,
}

export const Large = {
  render: () => <Spinner size="lg" />,
}

export const CustomLabel = {
  render: () => <Spinner size="md" aria-label="正在加载数据，请稍候" />,
}
