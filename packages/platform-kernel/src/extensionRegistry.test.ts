import { describe, expect, it } from "vitest"
import { createExtensionRegistry } from "./extensionRegistry"

describe("createExtensionRegistry", () => {
  it("registers and retrieves views by id", () => {
    const registry = createExtensionRegistry()
    const view = () => null

    registry.views.register("official.notes.card", view)

    expect(registry.views.get("official.notes.card")).toBe(view)
  })

  it("throws when a view id is missing", () => {
    const registry = createExtensionRegistry()

    expect(() => registry.views.get("missing.view")).toThrow("View not registered: missing.view")
  })
})
