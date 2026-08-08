import type { HostAdapter } from "./index"
import { createDefaultHostAdapter } from "./defaultAdapter"

export function createExtensionHostAdapter(overrides: Partial<HostAdapter> = {}): HostAdapter {
  return createDefaultHostAdapter("extension", "host.extension", overrides)
}
