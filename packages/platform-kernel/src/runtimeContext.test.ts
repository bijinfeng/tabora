import { describe, expect, it } from "vitest"
import type { PluginPermission } from "@tabora/plugin-api"
import { createEventBus } from "./eventBus"
import { createExtensionRegistry } from "./extensionRegistry"
import { createPluginRuntimeContext } from "./runtimeContext"

function runtimeWith(grantedPermissions: PluginPermission[]) {
  const events = createEventBus()
  const opened: unknown[] = []
  events.on("host.external.open", (payload) => opened.push(payload))

  return {
    opened,
    context: createPluginRuntimeContext({
      pluginId: "official.search-providers.basic",
      events,
      registry: createExtensionRegistry(),
      grantedPermissions,
    }),
  }
}

describe("createPluginRuntimeContext permissions", () => {
  it("allows opening external URLs that match declared hosts", () => {
    const { context, opened } = runtimeWith([{ type: "external-open", hosts: ["github.com"] }])

    expect(context.permissions.canOpenExternal("https://github.com/search?q=tabora")).toBe(true)
    expect(context.permissions.openExternal("https://github.com/search?q=tabora")).toBe(true)
    expect(opened).toEqual([{ url: "https://github.com/search?q=tabora" }])
  })

  it("blocks external URLs outside declared hosts", () => {
    const { context, opened } = runtimeWith([{ type: "external-open", hosts: ["github.com"] }])

    expect(context.permissions.canOpenExternal("https://example.com")).toBe(false)
    expect(context.permissions.openExternal("https://example.com")).toBe(false)
    expect(opened).toEqual([])
  })

  it("allows wildcard external-open permissions for trusted official plugins", () => {
    const { context } = runtimeWith([{ type: "external-open", hosts: ["*"] }])

    expect(context.permissions.canOpenExternal("https://www.google.com/search?q=tabora")).toBe(true)
  })
})
