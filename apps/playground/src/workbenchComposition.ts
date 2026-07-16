import { createWebHostAdapter } from "@tabora/host-adapters"
import {
  builtinDefaultWorkspacePreset,
  builtinPlugins,
  builtinWorkbenchShellConfig,
} from "@tabora/builtin-plugin-registry"
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
  const apiBaseUrl = import.meta.env.VITE_TABORA_API_BASE?.trim()
  return createWorkbenchRuntimeBootstrap({
    host: createWebHostAdapter({
      id: "host.playground",
    }),
    plugins: builtinPlugins,
    defaultWorkspacePreset: builtinDefaultWorkspacePreset,
    shellConfig: apiBaseUrl
      ? { ...builtinWorkbenchShellConfig, auth: { apiBaseUrl } }
      : builtinWorkbenchShellConfig,
  })
}
