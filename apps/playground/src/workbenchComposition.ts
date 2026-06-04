import { createWebHostAdapter } from "@tabora/host-adapters"
import { officialPlugins } from "@tabora/official-plugins"
import {
  createWorkbenchComposition,
  createWorkbenchRuntimeBootstrap,
  type WorkbenchComposition,
  type WorkbenchRuntimeBootstrap,
} from "@tabora/workbench-app"

export function createPlaygroundWorkbenchComposition(): WorkbenchComposition {
  return createWorkbenchComposition({
    host: createWebHostAdapter({
      id: "host.playground",
    }),
  })
}

export function createPlaygroundRuntimeBootstrap(): WorkbenchRuntimeBootstrap {
  return createWorkbenchRuntimeBootstrap({
    host: createWebHostAdapter({
      id: "host.playground",
    }),
    plugins: officialPlugins,
  })
}
