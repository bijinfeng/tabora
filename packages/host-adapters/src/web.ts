import type { HostAdapter } from "./index"

export function createWebHostAdapter(overrides: Partial<HostAdapter> = {}): HostAdapter {
  return {
    id: overrides.id ?? "host.web",
    platform: overrides.platform ?? "web",
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
