import type { HostAdapter } from "./index"

export function createWebHostAdapter(overrides: Partial<HostAdapter> = {}): HostAdapter {
  return {
    id: overrides.id ?? "host.web",
    platform: overrides.platform ?? "web",
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
