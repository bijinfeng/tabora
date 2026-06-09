import { Skeleton, SkeletonText } from "./skeleton.styled"

export function SkeletonDemo() {
  return (
    <div class="docs-skeleton-demo">
      <Skeleton width="42px" height="42px" rounded />
      <div>
        <SkeletonText lines={3} />
      </div>
    </div>
  )
}
