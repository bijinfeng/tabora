import { describe, expect, it } from "vitest"
import type { PluginManifest, PluginPermission } from "@tabora/plugin-api"
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

  it("exposes a runtime toast bridge through typed UI events", () => {
    const events = createEventBus()
    const toasts: unknown[] = []
    events.on("ui.toast.show", (payload) => toasts.push(payload))

    const context = createPluginRuntimeContext({
      pluginId: "plugin.example",
      events,
      registry: createExtensionRegistry(),
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

    const context = createPluginRuntimeContext({
      pluginId: "plugin.example",
      events,
      registry: createExtensionRegistry(),
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

  it("allows opening declared modal views even if they are not prefixed with plugin id", () => {
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
            view: "official.background.css-renderer.view",
            section: "appearance",
            scope: "workspace",
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

    context.ui.openModal("official.background.css-renderer.view")

    expect(modals).toEqual([
      {
        viewId: "official.background.css-renderer.view",
        props: { pluginId: "official.background.basic" },
      },
    ])
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

  it("collects view registration disposers for plugin-owned cleanup", () => {
    const registrationDisposers: Array<() => void> = []
    const registry = createExtensionRegistry()
    const context = createPluginRuntimeContext({
      pluginId: "plugin.example",
      events: createEventBus(),
      registry,
      registrationDisposers,
    })
    const view = () => null

    context.registry.views.register("plugin.example.view", view)

    expect(registrationDisposers).toHaveLength(1)
    expect(registry.views.has("plugin.example.view")).toBe(true)

    registrationDisposers[0]!()

    expect(registry.views.has("plugin.example.view")).toBe(false)
  })
})
