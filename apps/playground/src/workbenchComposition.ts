import {
  createAccountSyncService,
  createPluginSyncCollections,
  createWebHostAdapter,
  createWebStorageAdapter,
} from "@tabora/host-adapters"
import {
  createBuiltinAccountSyncPlugin,
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

const DEFAULT_PLAYGROUND_API_BASE_URL = "http://localhost:4000"

export function createPlaygroundWorkbenchComposition(): WorkbenchComposition {
  return createWorkbenchComposition({
    host: createWebHostAdapter({
      id: "host.playground",
    }),
    defaultWorkspacePreset: builtinDefaultWorkspacePreset,
  })
}

export function resolvePlaygroundApiBaseUrl(): string {
  const configured = import.meta.env.VITE_TABORA_API_BASE?.trim()
  return configured || DEFAULT_PLAYGROUND_API_BASE_URL
}

export function createPlaygroundRuntimeBootstrap(): WorkbenchRuntimeBootstrap {
  const apiBaseUrl = resolvePlaygroundApiBaseUrl()
  const storageAdapter = createWebStorageAdapter(undefined, { enableSync: true })
  const host = createWebHostAdapter({ id: "host.playground" })
  const accountSyncPlugin = createBuiltinAccountSyncPlugin({
    service: createAccountSyncService({
      host,
      storageAdapter,
      apiBaseUrl,
      syncCollections: createPluginSyncCollections(
        builtinPlugins.map((plugin) => plugin.module.manifest),
      ),
    }),
  })

  return createWorkbenchRuntimeBootstrap({
    host,
    plugins: [...builtinPlugins, accountSyncPlugin],
    defaultWorkspacePreset: builtinDefaultWorkspacePreset,
    shellConfig: builtinWorkbenchShellConfig,
    storageAdapter,
  })
}
