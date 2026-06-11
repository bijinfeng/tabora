import { createContext, useContext } from "solid-js"
import type { JSX } from "solid-js"
import type { PluginCatalog } from "@tabora/orchestrator"
import type { ViewRegistry } from "@tabora/platform-kernel"

import type { createWorkbenchShellControllerRuntime } from "./WorkbenchShellControllerRuntime"
import type { createWorkbenchSettingsPanelPropsBuilder } from "../surface/WorkbenchShellSettings"
import type { WorkbenchShellStateBundle } from "./WorkbenchShellState"
import type { ShellTranslation, WorkbenchShellPluginViewBoundaryCopy } from "../i18n"

// 组合根装配出的 shell 运行时 bundle。当前由 surface 装配消费；后续受控 surface 可从这里取更多成员。
export type WorkbenchShell = {
  state: WorkbenchShellStateBundle
  catalog: PluginCatalog
  views: ViewRegistry
  controllerRuntime: ReturnType<typeof createWorkbenchShellControllerRuntime>
  buildSettingsPanelProps: ReturnType<typeof createWorkbenchSettingsPanelPropsBuilder>
  layoutContent: () => JSX.Element
  tShell?: ShellTranslation
  shellCopy?: {
    pluginViewBoundaryCopy?: WorkbenchShellPluginViewBoundaryCopy
  }
}

const WorkbenchShellContext = createContext<WorkbenchShell>()

export function WorkbenchShellProvider(props: { shell: WorkbenchShell; children: JSX.Element }) {
  return (
    <WorkbenchShellContext.Provider value={props.shell}>
      {props.children}
    </WorkbenchShellContext.Provider>
  )
}

export function useWorkbenchShell(): WorkbenchShell {
  const shell = useContext(WorkbenchShellContext)
  if (!shell) {
    throw new Error("useWorkbenchShell must be used within a WorkbenchShellProvider")
  }

  return shell
}
