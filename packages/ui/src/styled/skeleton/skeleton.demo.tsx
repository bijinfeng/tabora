import * as stylex from "@stylexjs/stylex"
import { Skeleton, SkeletonText } from "./skeleton.styled"

import { demoStyles } from "../demoStyles"
export function SkeletonDemo() {
  return (
    <div {...stylex.attrs(demoStyles.controlStack)}>
      <div {...stylex.attrs(demoStyles.stackCompact)}>
        <strong>加载工作区</strong>
        <span>骨架屏应该尽量贴近真实内容形状，避免加载完成后布局跳动。</span>
      </div>
      <div {...stylex.attrs(demoStyles.skeletonDemo)}>
        <Skeleton width="42px" height="42px" rounded />
        <div>
          <SkeletonText lines={3} />
        </div>
      </div>
      <div {...stylex.attrs(demoStyles.row)}>
        <Skeleton width="88px" height="24px" rounded />
        <Skeleton width="128px" height="24px" rounded />
      </div>
    </div>
  )
}
