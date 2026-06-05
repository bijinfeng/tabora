import type { HostAdapter } from "./index"

export function createExtensionHostAdapter(overrides: Partial<HostAdapter> = {}): HostAdapter {
  return {
    id: overrides.id ?? "host.extension",
    platform: overrides.platform ?? "extension",
    capabilities: {
      externalOpen: true,
      themeApply: true,
      backgroundApply: true,
      importExportWorkspace: true,
      legacyMigration: false,
      clipboard: true,
      localFile: false,
      network: true,
      storage: true,
      ...overrides.capabilities,
    },
  }
}
