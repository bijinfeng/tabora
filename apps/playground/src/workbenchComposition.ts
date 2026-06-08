import { createWebHostAdapter } from "@tabora/host-adapters"
import { builtinDefaultWorkspacePreset, builtinPlugins } from "@tabora/builtin-plugin-registry"
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
    defaultWorkspacePreset: builtinDefaultWorkspacePreset,
  })
}

export function createPlaygroundRuntimeBootstrap(): WorkbenchRuntimeBootstrap {
  return createWorkbenchRuntimeBootstrap({
    host: createWebHostAdapter({
      id: "host.playground",
    }),
    plugins: builtinPlugins,
    defaultWorkspacePreset: builtinDefaultWorkspacePreset,
  })
}
