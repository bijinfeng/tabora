import "@tabora/ui/styles.css"
import "@tabora/workbench-shell/styles.css"
import { WorkbenchShellApp } from "@tabora/workbench-app"

import { createFnosRuntimeBootstrap, createFnosWorkbenchComposition } from "./workbenchComposition"

export function App() {
  const composition = createFnosWorkbenchComposition()
  const runtime = createFnosRuntimeBootstrap()

  return <WorkbenchShellApp composition={composition} runtime={runtime} />
}
