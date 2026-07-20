import { Skeleton, SkeletonText } from "./skeleton.styled"

import { demoStyles, sx } from "../demoStyles"
export function SkeletonDemo() {
  return (
    <div {...sx(demoStyles.controlStack)}>
      <div {...sx(demoStyles.stackCompact)}>
        <strong>加载工作区</strong>
        <span>骨架屏应该尽量贴近真实内容形状，避免加载完成后布局跳动。</span>
      </div>
      <div {...sx(demoStyles.skeletonDemo)}>
        <Skeleton width="42px" height="42px" rounded />
        <div>
          <SkeletonText lines={3} />
        </div>
      </div>
      <div {...sx(demoStyles.row)}>
        <Skeleton width="88px" height="24px" rounded />
        <Skeleton width="128px" height="24px" rounded />
      </div>
    </div>
  )
}
