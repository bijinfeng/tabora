import { createFnosAiSettingsService, createWebHostAdapter } from "@tabora/host-adapters"
import { createHttpAiRuntime } from "@tabora/ai-runtime"
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

  return typeof window === "undefined"
    ? "http://127.0.0.1:43120"
    : new URL(import.meta.env.BASE_URL, window.location.origin).href
}

export function createFnosRuntimeBootstrap(): WorkbenchRuntimeBootstrap {
  const apiBaseUrl = resolveFnosLocalApiBaseUrl()
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
    storageAdapter: createFnosStorageAdapter(apiBaseUrl),
    aiSettings: createFnosAiSettingsService({ baseUrl: apiBaseUrl }),
    ai: createHttpAiRuntime({
      baseUrl: apiBaseUrl,
      getRequest: async () => ({
        provider: "custom",
        // FNOS always replaces this transient placeholder with its device-admin configuration.
        custom: { baseUrl: "http://fnos-device", apiKey: "fnos-device", model: "fnos-device" },
      }),
    }),
  })
}
