import { describe, expect, it, vi } from "vitest"
import type { PluginManifest, PluginPermission } from "@tabora/plugin-api"
import { createEventBus } from "./eventBus"
import { createExtensionRegistry } from "./extensionRegistry"
import { collectPluginManifestViewIds, createPluginRuntimeContext } from "./runtimeContext"

function manifestWithViews(...viewIds: string[]): PluginManifest {
  return {
    id: "plugin.example",
    name: "Example",
    version: "1.0.0",
    apiVersion: "1.0.0",
    entry: "./entry",
    engine: { platform: "^1.0.0" },
    contributes: {
      widgets: viewIds.map((view, index) => ({
        id: `view-${index}`,
        title: view,
        supportedSizes: ["S"],
        defaultSize: "S",
        allowMultipleInstances: false,
        views: { card: view },
      })),
    },
  }
}

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
      requestedPermissions: grantedPermissions,
      grantedPermissions,
    }),
  }
}

describe("createPluginRuntimeContext permissions", () => {
  it("admits a widget's declared expand footer as a view registration", () => {
    const manifest: PluginManifest = {
      id: "plugin.example",
      name: "Example",
      version: "1.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^1.0.0" },
      contributes: {
        widgets: [
          {
            id: "widget",
            title: "Widget",
            supportedSizes: ["S"],
            defaultSize: "S",
            allowMultipleInstances: false,
            views: {
              card: "plugin.example.card",
              expandFooter: "plugin.example.expand-footer",
            },
          },
        ],
      },
    }
    const registry = createExtensionRegistry()
    const context = createPluginRuntimeContext({
      pluginId: manifest.id,
      events: createEventBus(),
      registry,
      manifest,
    })

    expect(collectPluginManifestViewIds(manifest)).toContain("plugin.example.expand-footer")
    context.views.register("plugin.example.expand-footer", () => null)

    expect(registry.views.has("plugin.example.expand-footer")).toBe(true)
  })

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

  it("does not honor a persisted grant when the current manifest no longer requests it", () => {
    const events = createEventBus()
    const context = createPluginRuntimeContext({
      pluginId: "plugin.example",
      events,
      registry: createExtensionRegistry(),
      requestedPermissions: [],
      grantedPermissions: [{ type: "external-open", hosts: ["github.com"] }],
    })

    expect(context.permissions.canOpenExternal("https://github.com/tabora")).toBe(false)
  })

  it("allows wildcard external-open permissions for trusted official plugins", () => {
    const { context } = runtimeWith([{ type: "external-open", hosts: ["*"] }])

    expect(context.permissions.canOpenExternal("https://www.google.com/search?q=tabora")).toBe(true)
  })

  it("rejects malformed external and network URLs", () => {
    const context = createPluginRuntimeContext({
      pluginId: "plugin.example",
      events: createEventBus(),
      registry: createExtensionRegistry(),
      requestedPermissions: [
        { type: "external-open", hosts: ["github.com"] },
        { type: "network", hosts: ["api.example.com"] },
      ],
      grantedPermissions: [
        { type: "external-open", hosts: ["github.com"] },
        { type: "network", hosts: ["api.example.com"] },
      ],
      network: { fetch: async () => new Response("ok") },
    })

    expect(context.permissions.canOpenExternal("not a URL")).toBe(false)
    expect(context.network.canFetch("not a URL")).toBe(false)
  })

  it("routes authorized network requests through the host bridge only", async () => {
    const hostFetch = vi.fn(async () => new Response("ok"))
    const context = createPluginRuntimeContext({
      pluginId: "plugin.example",
      events: createEventBus(),
      registry: createExtensionRegistry(),
      requestedPermissions: [{ type: "network", hosts: ["api.example.com"] }],
      grantedPermissions: [{ type: "network", hosts: ["api.example.com"] }],
      network: { fetch: hostFetch },
    })

    expect(context.network.canFetch("https://api.example.com/data")).toBe(true)
    await context.network.fetch("https://api.example.com/data", { method: "GET" })

    expect(hostFetch).toHaveBeenCalledWith("https://api.example.com/data", { method: "GET" })
  })

  it("rejects a declared network host the host never granted", async () => {
    const hostFetch = vi.fn(async () => new Response("ok"))
    const context = createPluginRuntimeContext({
      pluginId: "plugin.example",
      events: createEventBus(),
      registry: createExtensionRegistry(),
      requestedPermissions: [{ type: "network", hosts: ["api.example.com"] }],
      grantedPermissions: [{ type: "network", hosts: ["other.example.com"] }],
      network: { fetch: hostFetch },
    })

    expect(context.network.canFetch("https://api.example.com/data")).toBe(false)
    await expect(context.network.fetch("https://api.example.com/data")).rejects.toThrow(
      "attempted network access without permission",
    )
    expect(hostFetch).not.toHaveBeenCalled()
  })

  it("rejects network access to a host the plugin never declared", async () => {
    const hostFetch = vi.fn(async () => new Response("ok"))
    const context = createPluginRuntimeContext({
      pluginId: "plugin.example",
      events: createEventBus(),
      registry: createExtensionRegistry(),
      requestedPermissions: [{ type: "network", hosts: ["api.example.com"] }],
      grantedPermissions: [{ type: "network", hosts: ["api.example.com"] }],
      network: { fetch: hostFetch },
    })

    await expect(context.network.fetch("https://evil.example.com/data")).rejects.toThrow(
      "attempted network access without permission",
    )
    expect(hostFetch).not.toHaveBeenCalled()
  })

  it("observes a later grant because granted permissions are read lazily", async () => {
    const hostFetch = vi.fn(async () => new Response("ok"))
    let granted: PluginPermission[] = []
    const context = createPluginRuntimeContext({
      pluginId: "plugin.example",
      events: createEventBus(),
      registry: createExtensionRegistry(),
      requestedPermissions: [{ type: "network", hosts: ["api.example.com"] }],
      grantedPermissions: () => granted,
      network: { fetch: hostFetch },
    })

    expect(context.network.canFetch("https://api.example.com/data")).toBe(false)
    granted = [{ type: "network", hosts: ["api.example.com"] }]

    await context.network.fetch("https://api.example.com/data", { method: "GET" })
    expect(hostFetch).toHaveBeenCalledWith("https://api.example.com/data", { method: "GET" })
  })

  it("exposes a runtime toast bridge through typed UI events", () => {
    const events = createEventBus()
    const toasts: unknown[] = []
    events.on("ui.toast.show", (payload) => toasts.push(payload))

    const context = createPluginRuntimeContext({
      pluginId: "plugin.example",
      events,
      registry: createExtensionRegistry(),
      manifest: manifestWithViews("plugin.example.modal", "plugin.example.fullscreen"),
    })

    context.ui.showToast("Saved", { type: "success", duration: 3000 })

    expect(toasts).toEqual([
      {
        message: "Saved",
        options: { type: "success", duration: 3000 },
      },
    ])
  })

  it("tags modal and fullscreen UI events with the owner plugin id", () => {
    const events = createEventBus()
    const modals: unknown[] = []
    const fullscreens: unknown[] = []
    events.on("ui.modal.open", (payload) => modals.push(payload))
    events.on("ui.fullscreen.open", (payload) => fullscreens.push(payload))
    const registry = createExtensionRegistry()
    registry.views.register("plugin.example.modal", () => null)
    registry.views.register("plugin.example.fullscreen", () => null)

    const context = createPluginRuntimeContext({
      pluginId: "plugin.example",
      events,
      registry,
      manifest: manifestWithViews("plugin.example.modal", "plugin.example.fullscreen"),
    })

    context.ui.openModal("plugin.example.modal", { tab: "a", pluginId: "spoofed" })
    context.ui.openFullscreen("plugin.example.fullscreen", { mode: "detail" })

    expect(modals).toEqual([
      {
        viewId: "plugin.example.modal",
        props: { tab: "a", pluginId: "plugin.example" },
      },
    ])
    expect(fullscreens).toEqual([
      {
        viewId: "plugin.example.fullscreen",
        props: { mode: "detail", pluginId: "plugin.example" },
      },
    ])
  })

  it("blocks opening modal views that are neither namespaced nor declared in the manifest", () => {
    const events = createEventBus()
    const context = createPluginRuntimeContext({
      pluginId: "plugin.example",
      events,
      registry: createExtensionRegistry(),
    })

    expect(() => context.ui.openModal("other.plugin.modal")).toThrow(
      'Plugin "plugin.example" attempted to open undeclared modal view: other.plugin.modal',
    )
  })

  it("rejects a declared view that is not owned by the plugin namespace", () => {
    const events = createEventBus()
    const modals: unknown[] = []
    events.on("ui.modal.open", (payload) => modals.push(payload))

    const manifest: PluginManifest = {
      id: "official.background.basic",
      name: "Background Basic",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "builtin:official.background.basic",
      engine: { platform: "tabora" },
      contributes: {
        settingsPanels: [
          {
            id: "official.background.panel",
            title: "Background",
            content: {
              kind: "custom-view",
              view: "official.background.css-renderer.view",
            },
            section: "appearance",
            scope: "workspace",
            surfaces: ["desktop", "mobile"],
          },
        ],
      },
    }

    const context = createPluginRuntimeContext({
      pluginId: manifest.id,
      events,
      registry: createExtensionRegistry(),
      manifest,
    })

    expect(() => context.ui.openModal("official.background.css-renderer.view")).toThrow(
      'Plugin "official.background.basic" attempted to open undeclared modal view: official.background.css-renderer.view',
    )
    expect(modals).toEqual([])
  })

  it("exposes a plugin-scoped i18n bridge when provided", () => {
    const events = createEventBus()
    const calls: unknown[] = []
    const context = createPluginRuntimeContext({
      pluginId: "plugin.example",
      events,
      registry: createExtensionRegistry(),
      i18n: {
        locale: () => "en-US",
        registerMessages: (pluginId, bundles) => calls.push({ pluginId, bundles }),
        t: (pluginId, key) => `${pluginId}:${key}`,
        formatDate: () => "DATE",
        formatNumber: () => "NUM",
      },
    })

    expect(context.i18n?.locale()).toBe("en-US")
    context.i18n?.registerMessages([{ locale: "en-US", messages: { "plugin.example.k": "v" } }])
    expect(calls).toEqual([
      {
        pluginId: "plugin.example",
        bundles: [{ locale: "en-US", messages: { "plugin.example.k": "v" } }],
      },
    ])
    expect(context.i18n?.t("greeting.morning")).toBe("plugin.example:greeting.morning")
    expect(context.i18n?.formatDate(new Date())).toBe("DATE")
    expect(context.i18n?.formatNumber(1)).toBe("NUM")
  })

  it("does not expose the AI bridge without an AI permission grant", () => {
    const context = createPluginRuntimeContext({
      pluginId: "plugin.example",
      events: createEventBus(),
      registry: createExtensionRegistry(),
      ai: {
        generate: async () => ({ text: "hidden" }),
        stream: async function* () {},
      },
    })

    expect(context.ai).toBeUndefined()
  })

  it("exposes the AI bridge when the plugin has an AI generate grant", async () => {
    const context = createPluginRuntimeContext({
      pluginId: "plugin.example",
      events: createEventBus(),
      registry: createExtensionRegistry(),
      requestedPermissions: [{ type: "ai", access: ["generate"] }],
      grantedPermissions: [{ type: "ai", access: ["generate"] }],
      ai: {
        generate: async (request) => ({ text: `reply:${request.prompt}` }),
        stream: async function* () {},
      },
    })

    await expect(context.ai?.generate({ prompt: "hello" })).resolves.toEqual({
      text: "reply:hello",
    })
  })

  it("collects view registration disposers for plugin-owned cleanup", () => {
    const registrationDisposers: Array<() => void> = []
    const registry = createExtensionRegistry()
    const context = createPluginRuntimeContext({
      pluginId: "plugin.example",
      events: createEventBus(),
      registry,
      manifest: manifestWithViews("plugin.example.view"),
      registrationDisposers,
    })
    const view = () => null

    context.views.register("plugin.example.view", view)

    expect(registrationDisposers).toHaveLength(1)
    expect(registry.views.has("plugin.example.view")).toBe(true)

    registrationDisposers[0]!()

    expect(registry.views.has("plugin.example.view")).toBe(false)
  })

  it("exposes no global registry lookup and rejects another plugin's undeclared view", () => {
    const context = createPluginRuntimeContext({
      pluginId: "plugin.example",
      events: createEventBus(),
      registry: createExtensionRegistry(),
      manifest: manifestWithViews("plugin.example.view"),
    })

    expect("registry" in context).toBe(false)
    expect(() => context.views.register("other.plugin.view", () => null)).toThrow(
      'Plugin "plugin.example" attempted to register undeclared view: other.plugin.view',
    )
  })

  it("allows only manifest-declared settings providers and collects their disposer", () => {
    const registrationDisposers: Array<() => void> = []
    const registry = createExtensionRegistry()
    const manifest: PluginManifest = {
      id: "plugin.example",
      name: "Example",
      version: "1.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {
        settingsPanels: [
          {
            id: "plugin.example.settings",
            title: "Settings",
            section: "general",
            scope: "workspace",
            surfaces: ["desktop", "mobile"],
            content: {
              kind: "schema",
              provider: "plugin.example.settings.provider",
              schemaVersion: 1,
            },
          },
        ],
      },
    }
    const context = createPluginRuntimeContext({
      pluginId: manifest.id,
      events: createEventBus(),
      registry,
      manifest,
      registrationDisposers,
    })
    const provider = { getModel: () => ({ version: 1 as const, nodes: [] }), dispatch: () => {} }

    context.settings.register("plugin.example.settings.provider", provider)

    expect(registry.settings.get("plugin.example.settings.provider")).toBe(provider)
    expect(() => context.settings.register("plugin.example.undeclared.provider", provider)).toThrow(
      "attempted to register undeclared settings provider",
    )

    registrationDisposers[0]!()
    expect(registry.settings.has("plugin.example.settings.provider")).toBe(false)
  })
})
