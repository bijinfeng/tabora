import { createExtensionHostAdapter } from "@tabora/host-adapters"
import {
  builtinDefaultWorkspacePreset,
  builtinPlugins,
  builtinWorkbenchShellConfig,
} from "@tabora/builtin-plugin-registry"
import { createWorkbenchComposition, createWorkbenchRuntimeBootstrap } from "@tabora/workbench-app"

export function createExtensionWorkbenchComposition() {
  return createWorkbenchComposition({
    host: createExtensionHostAdapter({
      id: "host.extension.newtab",
    }),
    defaultWorkspacePreset: builtinDefaultWorkspacePreset,
  })
}

export function createExtensionRuntimeBootstrap() {
  const composition = createExtensionWorkbenchComposition()
  const apiBaseUrl = import.meta.env.VITE_TABORA_API_BASE?.trim()

  return createWorkbenchRuntimeBootstrap({
    host: composition.host,
    plugins: builtinPlugins,
    defaultWorkspacePreset: builtinDefaultWorkspacePreset,
    shellConfig: apiBaseUrl
      ? { ...builtinWorkbenchShellConfig, auth: { apiBaseUrl } }
      : builtinWorkbenchShellConfig,
    databaseName: "tabora-extension",
  })
}
