import type { HostAdapter } from "./index"

export function createExtensionHostAdapter(overrides: Partial<HostAdapter> = {}): HostAdapter {
  const capabilities = {
    externalOpen: true,
    themeApply: true,
    backgroundApply: true,
    importExportWorkspace: true,
    clipboard: true,
    localFile: false,
    network: true,
    storage: true,
    ...overrides.capabilities,
  }
  return {
    id: overrides.id ?? "host.extension",
    platform: overrides.platform ?? "extension",
    capabilities,
    ...(capabilities.network
      ? {
          network: overrides.network ?? {
            fetch: (url: string, init?: RequestInit) => fetch(url, init),
          },
        }
      : {}),
  }
}
