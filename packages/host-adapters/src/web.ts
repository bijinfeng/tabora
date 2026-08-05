import type { HostAdapter } from "./index"

export function createWebHostAdapter(overrides: Partial<HostAdapter> = {}): HostAdapter {
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
    id: overrides.id ?? "host.web",
    platform: overrides.platform ?? "web",
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
