import type { WorkbenchShell } from "../shell/WorkbenchShellContext"
import { createWorkbenchShellSurfaceActionProps } from "./WorkbenchShellSurfaceActionProps"
import { createWorkbenchShellSurfaceOverlayProps } from "./WorkbenchShellSurfaceOverlayProps"
import { createWorkbenchShellSurfaceSettingsProps } from "./WorkbenchShellSurfaceSettingsProps"

// 直接从 shell bundle 读取，产出 surface host 子组件所需的 8 组 props。
// 替代了原先「组合根把 ~50 个本地变量拍平成 57 个参数」的中间层。
export function createWorkbenchShellSurfaceProps(shell: WorkbenchShell) {
  return {
    content: shell.layoutContent(),
    ...createWorkbenchShellSurfaceActionProps(shell),
    ...createWorkbenchShellSurfaceSettingsProps(shell),
    ...createWorkbenchShellSurfaceOverlayProps(shell),
  }
}

export type WorkbenchShellSurfaceProps = ReturnType<typeof createWorkbenchShellSurfaceProps>
