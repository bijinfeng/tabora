import { describe, expect, it } from "vitest"
import { createExtensionHostAdapter } from "./extension"
import { createWebHostAdapter } from "./web"

describe("host adapters", () => {
  it("creates web adapter with expected platform defaults", () => {
    const adapter = createWebHostAdapter({ id: "host.playground" })

    expect(adapter.platform).toBe("web")
    expect(adapter.capabilities.externalOpen).toBe(true)
    expect(adapter.capabilities.storage).toBe(true)
    expect(adapter.id).toBe("host.playground")
  })

  it("creates extension adapter with extension platform", () => {
    const adapter = createExtensionHostAdapter()

    expect(adapter.platform).toBe("extension")
    expect(adapter.id).toBe("host.extension")
  })
})
