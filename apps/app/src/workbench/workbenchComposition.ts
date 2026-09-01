import {
  createAccountSyncService,
  createCloudAiRuntime,
  createLocalAiSettingsService,
  createLocalStorageAuthStorage,
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
  createWorkbenchComposition as createComposition,
  createWorkbenchRuntimeBootstrap as createRuntimeBootstrap,
  type WorkbenchComposition,
  type WorkbenchRuntimeBootstrap,
} from "@tabora/workbench-app"

export function createWorkbenchComposition(): WorkbenchComposition {
  return createComposition({
    // 保持既有 identity，让 playground 迁入后仍可读取用户本地的工作台数据。
    host: createWebHostAdapter({ id: "host.playground" }),
    defaultWorkspacePreset: builtinDefaultWorkspacePreset,
  })
}

export function resolveWorkbenchApiBaseUrl(): string {
  return import.meta.env.VITE_TABORA_API_BASE?.trim() || ""
}

export function createWorkbenchRuntimeBootstrap(): WorkbenchRuntimeBootstrap {
  const apiBaseUrl = resolveWorkbenchApiBaseUrl()
  const storageAdapter = createWebStorageAdapter(undefined, { enableSync: true })
  const host = createWebHostAdapter({ id: "host.playground" })
  const authStorage = createLocalStorageAuthStorage()
  const defaultBuiltinModelId = import.meta.env.VITE_TABORA_AI_MODEL ?? "gpt-4.1-mini"
  const accountService = createAccountSyncService({
    host,
    storageAdapter,
    apiBaseUrl,
    authStorage,
    syncCollections: createPluginSyncCollections(
      builtinPlugins.map((plugin) => plugin.module.manifest),
    ),
  })
  const accountPlugin = createBuiltinAccountSyncPlugin({ service: accountService })
  const aiSettings = createLocalAiSettingsService({
    storage: authStorage,
    defaultBuiltinModelId,
    apiBaseUrl,
    authClient: accountService.authClient,
  })

  return createRuntimeBootstrap({
    host,
    plugins: [...builtinPlugins, accountPlugin],
    defaultWorkspacePreset: builtinDefaultWorkspacePreset,
    shellConfig: builtinWorkbenchShellConfig,
    storageAdapter,
    aiSettings,
    ai: createCloudAiRuntime({
      baseUrl: apiBaseUrl,
      settings: aiSettings,
      authClient: accountService.authClient,
    }),
  })
}
