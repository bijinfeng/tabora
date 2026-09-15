import { describe, expect, it } from "vitest"
import type { AiToolContribution } from "@tabora/plugin-api"
import { createExtensionRegistry, type AiToolContributionRef } from "./extensionRegistry"

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
  it("keeps later registrations when a stale disposer runs", () => {
    const registry = createExtensionRegistry()
    const firstView = () => null
    const replacementView = () => null

    const disposeFirst = registry.views.register("official.notes.card", firstView)
    disposeFirst()
    registry.views.register("official.notes.card", replacementView)
    disposeFirst()

    expect(registry.views.get("official.notes.card")).toBe(replacementView)
  })

  it("retrieves settings providers and executes registered commands", async () => {
    const registry = createExtensionRegistry()
    const provider = { getModel: () => ({ version: 1 as const, nodes: [] }), dispatch: () => {} }
    const command = async () => {}

    const invocation = { commandId: "official.account.refresh", source: "programmatic" as const }

    registry.settings.register("official.account.provider", provider)
    registry.commands.register("official.account.refresh", command)

    expect(registry.settings.get("official.account.provider")).toBe(provider)
    expect(registry.settings.has("official.account.provider")).toBe(true)
    await expect(registry.commands.execute("official.account.refresh", invocation)).resolves.toBe(
      true,
    )
    await expect(registry.commands.execute("missing.command", invocation)).resolves.toBe(false)
    expect(() => registry.commands.get("missing.command")).toThrow(
      "Command handler not registered: missing.command",
    )
  })
})

describe("aiTool registry", () => {
  const exampleContribution: AiToolContribution = {
    id: "official.ai.example.greet",
    name: "greet",
    description: "Greet someone by name",
    inputSchema: {
      type: "object",
      properties: { name: { type: "string" } },
      required: ["name"],
      additionalProperties: false,
    },
  }
  const exampleRef: AiToolContributionRef = {
    pluginId: "official.ai.example",
    kind: "ai-tool",
    id: "official.ai.example.greet",
    contribution: exampleContribution,
  }
  const exampleHandler = async (input: { args: Record<string, unknown> }) =>
    `hello ${input.args.name as string}`

  it("register returns disposer, entries() returns registry snapshot, listRegistered() filters refs", () => {
    const registry = createExtensionRegistry()
    const dispose = registry.aiTools.register("official.ai.example", exampleRef, exampleHandler)

    const entries = Array.from(registry.aiTools.entries())
    expect(entries).toHaveLength(1)
    const [entry] = entries
    expect(entry?.ref).toBe(exampleRef)
    expect(entry?.handler).toBe(exampleHandler)

    const registered = registry.aiTools.listRegistered()
    expect(registered).toHaveLength(1)
    expect(registered.at(0)).toBe(exampleRef)

    const filtered = registry.aiTools.listRegistered("official.ai.example")
    expect(filtered).toHaveLength(1)

    const empty = registry.aiTools.listRegistered("other.plugin")
    expect(empty).toHaveLength(0)

    dispose()
    expect(Array.from(registry.aiTools.entries())).toHaveLength(0)
    expect(registry.aiTools.listRegistered()).toHaveLength(0)
  })

  it("clearPluginEntries removes all tools belonging to the plugin", () => {
    const registry = createExtensionRegistry()
    const anotherContribution: AiToolContribution = {
      ...exampleContribution,
      id: "official.ai.example.bye",
      name: "bye",
    }
    const anotherRef: AiToolContributionRef = {
      pluginId: "official.ai.example",
      kind: "ai-tool",
      id: "official.ai.example.bye",
      contribution: anotherContribution,
    }
    const otherRef: AiToolContributionRef = {
      pluginId: "official.other",
      kind: "ai-tool",
      id: "official.other.tick",
      contribution: {
        id: "official.other.tick",
        name: "tick",
        description: "tick",
        inputSchema: { type: "object" },
      },
    }
    registry.aiTools.register("official.ai.example", exampleRef, exampleHandler)
    registry.aiTools.register("official.ai.example", anotherRef, exampleHandler)
    registry.aiTools.register("official.other", otherRef, exampleHandler)

    registry.aiTools.clearPluginEntries("official.ai.example")

    const remaining = registry.aiTools.listRegistered()
    expect(remaining.map((ref) => ref.pluginId)).toEqual(["official.other"])
  })

  it("rejects mismatched plugin id, and rejects duplicate registration preserving original", () => {
    const registry = createExtensionRegistry()
    expect(() => registry.aiTools.register("official.other", exampleRef, exampleHandler)).toThrow(
      "aiTool plugin id mismatch",
    )

    registry.aiTools.register("official.ai.example", exampleRef, exampleHandler)
    const replacement = async () => "replaced"
    expect(() => registry.aiTools.register("official.ai.example", exampleRef, replacement)).toThrow(
      "aiTool already registered",
    )
    const found = Array.from(registry.aiTools.entries())[0]
    expect(found?.handler).toBe(exampleHandler)
  })
})
