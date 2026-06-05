import { describe, expect, it } from "vitest"
import { createExtensionHostAdapter } from "./extension"
import { createWebHostAdapter } from "./web"
import {
  createExtensionHostAdapter as createExtensionHostAdapterFromIndex,
  createWebHostAdapter as createWebHostAdapterFromIndex,
} from "./index"

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

  it("re-exports platform adapters from the package index", () => {
    expect(createWebHostAdapterFromIndex).toBe(createWebHostAdapter)
    expect(createExtensionHostAdapterFromIndex).toBe(createExtensionHostAdapter)
  })
})
