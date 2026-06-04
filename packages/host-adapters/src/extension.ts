import type { HostAdapter } from "./index"

export function createExtensionHostAdapter(overrides: Partial<HostAdapter> = {}): HostAdapter {
  return {
    id: overrides.id ?? "host.extension",
    platform: overrides.platform ?? "extension",
    capabilities: {
      canOpenExternal: true,
      canApplyTheme: true,
      canApplyBackground: true,
      canImportExportWorkspace: true,
      canRunLegacyMigration: true,
      ...overrides.capabilities,
    },
  }
}
