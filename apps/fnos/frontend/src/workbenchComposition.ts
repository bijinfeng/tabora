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

import { createFnosStorageAdapter } from "./localStorageAdapter"

export function createFnosWorkbenchComposition(): WorkbenchComposition {
  return createWorkbenchComposition({
    host: createWebHostAdapter({ id: "host.fnos" }),
    defaultWorkspacePreset: builtinDefaultWorkspacePreset,
  })
}

export function resolveFnosLocalApiBaseUrl(): string {
  const configured = import.meta.env.VITE_FNOS_API_BASE?.trim()
  if (configured) {
    return configured
  }

  if (import.meta.env.DEV) {
    return "http://127.0.0.1:43120"
  }

  return typeof window === "undefined" ? "http://127.0.0.1:43120" : window.location.origin
}

export function createFnosRuntimeBootstrap(): WorkbenchRuntimeBootstrap {
  return createWorkbenchRuntimeBootstrap({
    host: createWebHostAdapter({
      id: "host.fnos",
      capabilities: {
        externalOpen: true,
        themeApply: true,
        backgroundApply: true,
        importExportWorkspace: false,
        clipboard: true,
        localFile: false,
        network: false,
        storage: true,
      },
    }),
    plugins: builtinPlugins,
    defaultWorkspacePreset: builtinDefaultWorkspacePreset,
    shellConfig: builtinWorkbenchShellConfig,
    storageAdapter: createFnosStorageAdapter(resolveFnosLocalApiBaseUrl()),
  })
}
