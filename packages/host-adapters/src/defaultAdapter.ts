import type { HostAdapter, HostPlatform } from "./index"

export function createDefaultHostAdapter(
  platform: HostPlatform,
  id: string,
  overrides: Partial<HostAdapter>,
): HostAdapter {
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
    id: overrides.id ?? id,
    platform: overrides.platform ?? platform,
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
