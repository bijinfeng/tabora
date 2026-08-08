import type { HostAdapter } from "./index"
import { createDefaultHostAdapter } from "./defaultAdapter"

export function createWebHostAdapter(overrides: Partial<HostAdapter> = {}): HostAdapter {
  return createDefaultHostAdapter("web", "host.web", overrides)
}
