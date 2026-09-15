import {
  createAccountSyncService,
  createChromeStorageAuthStorage,
  createCloudAiRuntime,
  createExtensionHostAdapter,
  createLocalAiSettingsService,
  createPluginSyncCollections,
  createWebStorageAdapter,
} from "@tabora/host-adapters"
import {
  createBuiltinAccountSyncPlugin,
  builtinDefaultWorkspacePreset,
  builtinPlugins,
  builtinWorkbenchShellConfig,
} from "@tabora/builtin-plugin-registry"
import { createWorkbenchComposition, createWorkbenchRuntimeBootstrap } from "@tabora/workbench-app"

const DEFAULT_BUILTIN_MODEL = "gpt-4.1-mini"

export function createExtensionWorkbenchComposition() {
  return createWorkbenchComposition({
    host: createExtensionHostAdapter({
      id: "host.extension.newtab",
    }),
    defaultWorkspacePreset: builtinDefaultWorkspacePreset,
  })
}

export function createExtensionRuntimeBootstrap() {
  const apiBaseUrl = import.meta.env.VITE_TABORA_API_BASE?.trim()
  const host = createExtensionHostAdapter({ id: "host.extension.newtab" })
  const storageAdapter = createWebStorageAdapter(undefined, { enableSync: true })
  const authStorage = apiBaseUrl ? createChromeStorageAuthStorage() : undefined
  const accountService = apiBaseUrl
    ? createAccountSyncService({
        host,
        storageAdapter,
        apiBaseUrl,
        ...(authStorage ? { authStorage } : {}),
        syncCollections: createPluginSyncCollections(
          builtinPlugins.map((plugin) => plugin.module.manifest),
        ),
      })
    : undefined
  const aiSettings = createLocalAiSettingsService({
    storage: authStorage ?? createChromeStorageAuthStorage(),
    defaultBuiltinModelId: DEFAULT_BUILTIN_MODEL,
    ...(apiBaseUrl ? { apiBaseUrl } : {}),
    ...(accountService ? { authClient: accountService.authClient } : {}),
  })
  const accountPlugin = accountService
    ? createBuiltinAccountSyncPlugin({ service: accountService })
    : undefined

  return createWorkbenchRuntimeBootstrap({
    host,
    plugins: accountPlugin ? [...builtinPlugins, accountPlugin] : builtinPlugins,
    defaultWorkspacePreset: builtinDefaultWorkspacePreset,
    shellConfig: apiBaseUrl
      ? { ...builtinWorkbenchShellConfig, auth: { apiBaseUrl } }
      : builtinWorkbenchShellConfig,
    storageAdapter,
    aiSettings,
    ...(apiBaseUrl
      ? {
          ai: createCloudAiRuntime({
            baseUrl: apiBaseUrl,
            settings: aiSettings,
            authClient: accountService!.authClient,
          }),
        }
      : {}),
  })
}
