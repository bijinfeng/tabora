import { Skeleton, SkeletonText } from "./skeleton.styled"

export function SkeletonDemo() {
  return (
    <div class="docs-control-stack">
      <div class="docs-stack compact">
        <strong>加载工作区</strong>
        <span>骨架屏应该尽量贴近真实内容形状，避免加载完成后布局跳动。</span>
      </div>
      <div class="docs-skeleton-demo">
        <Skeleton width="42px" height="42px" rounded />
        <div>
          <SkeletonText lines={3} />
        </div>
      </div>
      <div class="docs-row">
        <Skeleton width="88px" height="24px" rounded />
        <Skeleton width="128px" height="24px" rounded />
      </div>
    </div>
  )
}
