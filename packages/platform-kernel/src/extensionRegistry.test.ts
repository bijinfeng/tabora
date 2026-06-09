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

  it("does not let an old disposer remove a replacement view", () => {
    const registry = createExtensionRegistry()
    const firstView = () => null
    const replacementView = () => null

    const disposeFirst = registry.views.register("official.notes.card", firstView)
    registry.views.register("official.notes.card", replacementView)
    disposeFirst()

    expect(registry.views.get("official.notes.card")).toBe(replacementView)
  })
})
