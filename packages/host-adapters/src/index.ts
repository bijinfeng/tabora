export type HostPlatform = "web" | "extension" | "desktop-webview"

export type HostCapabilities = {
  canOpenExternal: boolean
  canApplyTheme: boolean
  canApplyBackground: boolean
  canImportExportWorkspace: boolean
  canRunLegacyMigration: boolean
}

export type HostAdapter = {
  id: string
  platform: HostPlatform
  capabilities: HostCapabilities
}

export function defineHostAdapter(adapter: HostAdapter): HostAdapter {
  return adapter
}

export { createWebHostAdapter } from "./web"
export { createExtensionHostAdapter } from "./extension"
