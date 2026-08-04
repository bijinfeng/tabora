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

export function createFnosWorkbenchComposition(): WorkbenchComposition {
  return createWorkbenchComposition({
    host: createWebHostAdapter({ id: "host.fnos" }),
    defaultWorkspacePreset: builtinDefaultWorkspacePreset,
  })
}

export function resolveFnosApiBaseUrl(): string | undefined {
  const configured = import.meta.env.VITE_TABORA_API_BASE?.trim()
  if (configured) {
    return configured
  }

  return typeof window === "undefined" ? undefined : window.location.origin
}

export function createFnosRuntimeBootstrap(): WorkbenchRuntimeBootstrap {
  const apiBaseUrl = resolveFnosApiBaseUrl()

  return createWorkbenchRuntimeBootstrap({
    host: createWebHostAdapter({ id: "host.fnos" }),
    plugins: builtinPlugins,
    defaultWorkspacePreset: builtinDefaultWorkspacePreset,
    shellConfig: apiBaseUrl
      ? { ...builtinWorkbenchShellConfig, auth: { apiBaseUrl } }
      : builtinWorkbenchShellConfig,
    databaseName: "tabora-fnos",
  })
}
