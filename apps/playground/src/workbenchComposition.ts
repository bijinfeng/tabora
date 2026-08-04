import { createWebHostAdapter, createWebStorageAdapter } from "@tabora/host-adapters"
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
  if (configured) {
    return configured
  }
  // 未配置时回退到当前页面地址，方便同域部署直接访问后端
  return typeof window === "undefined" ? undefined : window.location.origin
}

export function createPlaygroundRuntimeBootstrap(): WorkbenchRuntimeBootstrap {
  const apiBaseUrl = resolvePlaygroundApiBaseUrl()
  const storageAdapter = createWebStorageAdapter()
  const host = createWebHostAdapter({ id: "host.playground" })
  const accountSyncPlugin = apiBaseUrl
    ? createBuiltinAccountSyncPlugin({
        host,
        storageAdapter,
        apiBaseUrl,
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
