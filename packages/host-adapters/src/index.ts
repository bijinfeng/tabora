export type HostPlatform = "web" | "extension" | "desktop-webview"

export type HostCapabilities = {
  externalOpen: boolean
  themeApply: boolean
  backgroundApply: boolean
  importExportWorkspace: boolean
  clipboard: boolean
  localFile: boolean
  network: boolean
  storage: boolean
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
export type { AuthStorage } from "./authStorage"
export { createLocalStorageAuthStorage, createChromeStorageAuthStorage } from "./authStorage"
