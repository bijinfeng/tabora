import "@tabora/ui/styles.css"
import "@tabora/workbench-shell/styles.css"
import { WorkbenchShellApp } from "@tabora/workbench-app"

import {
  createPlaygroundRuntimeBootstrap,
  createPlaygroundWorkbenchComposition,
} from "./workbenchComposition"

export function App() {
  const composition = createPlaygroundWorkbenchComposition()
  const runtime = createPlaygroundRuntimeBootstrap()

  return <WorkbenchShellApp composition={composition} runtime={runtime} />
}
