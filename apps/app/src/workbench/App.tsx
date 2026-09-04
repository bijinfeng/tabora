import "@tabora/workbench-shell/styles.css"
import { WorkbenchShellApp } from "@tabora/workbench-app"

import { createWorkbenchRuntimeBootstrap, createWorkbenchComposition } from "./workbenchComposition"

export function App() {
  const composition = createWorkbenchComposition()
  const runtime = createWorkbenchRuntimeBootstrap()

  return <WorkbenchShellApp composition={composition} runtime={runtime} />
}
