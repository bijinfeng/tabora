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

export function createPlaygroundWorkbenchComposition(): WorkbenchComposition {
  return createWorkbenchComposition({
    host: createWebHostAdapter({
      id: "host.playground",
    }),
    defaultWorkspacePreset: builtinDefaultWorkspacePreset,
  })
}

export function resolvePlaygroundApiBaseUrl(): string | undefined {
  const configured = import.meta.env.VITE_TABORA_API_BASE?.trim()
  return configured || undefined
}

export function createPlaygroundRuntimeBootstrap(): WorkbenchRuntimeBootstrap {
  const apiBaseUrl = resolvePlaygroundApiBaseUrl()
  const storageAdapter = createWebStorageAdapter(undefined, { enableSync: Boolean(apiBaseUrl) })
  const host = createWebHostAdapter({ id: "host.playground" })
  const accountSyncPlugin = apiBaseUrl
    ? createBuiltinAccountSyncPlugin({
        service: createAccountSyncService({
          host,
          storageAdapter,
          apiBaseUrl,
          syncCollections: createPluginSyncCollections(
            builtinPlugins.map((plugin) => plugin.module.manifest),
          ),
        }),
      })
    : null

  return createWorkbenchRuntimeBootstrap({
    host,
    plugins: accountSyncPlugin ? [...builtinPlugins, accountSyncPlugin] : builtinPlugins,
    defaultWorkspacePreset: builtinDefaultWorkspacePreset,
    shellConfig: builtinWorkbenchShellConfig,
    storageAdapter,
  })
}
