import { WorkbenchShellApp } from "@tabora/workbench-app"

import {
  createExtensionRuntimeBootstrap,
  createExtensionWorkbenchComposition,
} from "./workbenchComposition"

export function App() {
  const composition = createExtensionWorkbenchComposition()
  const runtime = createExtensionRuntimeBootstrap()

  return <WorkbenchShellApp composition={composition} runtime={runtime} />
}
