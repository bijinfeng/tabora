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
