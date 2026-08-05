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

  it("returns a disposer that removes the registered view", () => {
    const registry = createExtensionRegistry()
    const view = () => null

    const dispose = registry.views.register("official.notes.card", view)
    dispose()

    expect(registry.views.has("official.notes.card")).toBe(false)
  })

  it("rejects a duplicate view registration and retains the original registration", () => {
    const registry = createExtensionRegistry()
    const firstView = () => null
    const replacementView = () => null

    registry.views.register("official.notes.card", firstView)

    expect(() => registry.views.register("official.notes.card", replacementView)).toThrow(
      "View already registered: official.notes.card",
    )
    expect(registry.views.get("official.notes.card")).toBe(firstView)
  })

  it("rejects a duplicate settings provider registration", () => {
    const registry = createExtensionRegistry()
    const first = { getModel: () => ({ version: 1 as const, nodes: [] }), dispatch: () => {} }
    const replacement = { getModel: () => ({ version: 1 as const, nodes: [] }), dispatch: () => {} }

    registry.settings.register("official.account.provider", first)

    expect(() => registry.settings.register("official.account.provider", replacement)).toThrow(
      "Settings provider already registered: official.account.provider",
    )
    expect(registry.settings.get("official.account.provider")).toBe(first)
  })
})
