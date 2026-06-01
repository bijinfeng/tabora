import { Skeleton, SkeletonText } from "@tabora/ui"

export default {
  title: "Feedback/Skeleton",
  component: Skeleton,
  argTypes: {
    width: { control: "text" },
    height: { control: "text" },
    rounded: { control: "boolean" },
  },
  args: {
    rounded: false,
  },
}

export const Default = {
  render: () => <Skeleton width="200px" height="20px" />,
}

export const Circle = {
  render: () => <Skeleton width="48px" height="48px" rounded />,
}

export const Card = {
  render: () => (
    <div style={{ width: "200px", "border-radius": "8px", overflow: "hidden" }}>
      <Skeleton width="200px" height="120px" />
      <div style={{ padding: "8px" }}>
        <Skeleton width="160px" height="16px" />
        <div style={{ height: "8px" }} />
        <Skeleton width="120px" height="14px" />
      </div>
    </div>
  ),
}

export const Text = {
  render: () => <SkeletonText lines={3} />,
}

export const SingleLine = {
  render: () => <SkeletonText lines={1} />,
}

export const FiveLines = {
  render: () => <SkeletonText lines={5} />,
}
