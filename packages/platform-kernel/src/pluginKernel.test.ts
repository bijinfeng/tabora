import { describe, expect, it } from "vitest"
import type { PluginManifest } from "@tabora/plugin-api"
import { createPluginKernel } from "./pluginKernel"

describe("createPluginKernel", () => {
  it("activates enabled plugins and exposes registered views", async () => {
    const manifest: PluginManifest = {
      id: "official.test",
      name: "Official Test",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {},
    }

    const kernel = createPluginKernel()
    await kernel.discover([
      {
        manifest,
        enabled: true,
        activate(context) {
          context.registry.views.register("official.test.view", () => null)
        },
      },
    ])
    await kernel.activateEnabledPlugins()

    expect(kernel.registry.views.has("official.test.view")).toBe(true)
  })

  it("unregisters plugin views when the plugin is disabled", async () => {
    const manifest: PluginManifest = {
      id: "official.cleanup",
      name: "Official Cleanup",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {},
    }

    const kernel = createPluginKernel()
    await kernel.discover([
      {
        manifest,
        enabled: true,
        activate(context) {
          context.registry.views.register("official.cleanup.view", () => null)
        },
      },
    ])
    await kernel.activateEnabledPlugins()

    expect(kernel.registry.views.has("official.cleanup.view")).toBe(true)

    await kernel.setPluginEnabled("official.cleanup", false)

    expect(kernel.registry.views.has("official.cleanup.view")).toBe(false)
  })

  it("does not activate an already active plugin twice", async () => {
    const manifest: PluginManifest = {
      id: "official.idempotent",
      name: "Official Idempotent",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {},
    }
    let activationCount = 0

    const kernel = createPluginKernel()
    await kernel.discover([
      {
        manifest,
        enabled: true,
        activate() {
          activationCount += 1
        },
      },
    ])

    await kernel.activateEnabledPlugins()
    await kernel.activateEnabledPlugins()
    await kernel.setPluginEnabled("official.idempotent", true)

    expect(activationCount).toBe(1)
  })

  it("runs an explicit activation disposer when the plugin is disabled", async () => {
    const manifest: PluginManifest = {
      id: "official.explicit-dispose",
      name: "Official Explicit Dispose",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {},
    }
    let disposeCount = 0

    const kernel = createPluginKernel()
    await kernel.discover([
      {
        manifest,
        enabled: true,
        activate() {
          return () => {
            disposeCount += 1
          }
        },
      },
    ])

    await kernel.activateEnabledPlugins()
    await kernel.setPluginEnabled("official.explicit-dispose", false)

    expect(disposeCount).toBe(1)
  })

  it("persists an error record when manually enabled plugin activation fails", async () => {
    const saved: Array<{ id: string; enabled: boolean; status: string; lastError?: string }> = []
    const manifest: PluginManifest = {
      id: "official.enable-fails",
      name: "Official Enable Fails",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {},
    }

    const kernel = createPluginKernel({
      lifecycleStore: {
        async save(record) {
          saved.push({
            id: record.id,
            enabled: record.enabled,
            status: record.status,
            ...(record.lastError ? { lastError: record.lastError } : {}),
          })
        },
      },
    })

    await kernel.discover([
      {
        manifest,
        enabled: false,
        activate() {
          throw new Error("activation exploded")
        },
      },
    ])
    await kernel.setPluginEnabled("official.enable-fails", true)

    expect(saved.some((record) => record.status === "active")).toBe(false)
    expect(saved.at(-1)).toEqual({
      id: "official.enable-fails",
      enabled: true,
      status: "error",
      lastError: "activation exploded",
    })
  })

  it("disposes active plugin registrations when plugins are rediscovered", async () => {
    const firstManifest: PluginManifest = {
      id: "official.rediscover",
      name: "Official Rediscover",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {},
    }
    const replacementManifest: PluginManifest = {
      ...firstManifest,
      version: "0.0.1",
    }
    let replacementActivated = false

    const kernel = createPluginKernel()
    await kernel.discover([
      {
        manifest: firstManifest,
        enabled: true,
        activate(context) {
          context.registry.views.register("official.rediscover.view", () => null)
        },
      },
    ])
    await kernel.activateEnabledPlugins()

    expect(kernel.registry.views.has("official.rediscover.view")).toBe(true)

    await kernel.discover([
      {
        manifest: replacementManifest,
        enabled: true,
        activate(context) {
          replacementActivated = true
          context.registry.views.register("official.rediscover.replacement", () => null)
        },
      },
    ])

    expect(kernel.registry.views.has("official.rediscover.view")).toBe(false)

    await kernel.activateEnabledPlugins()

    expect(replacementActivated).toBe(true)
    expect(kernel.registry.views.has("official.rediscover.replacement")).toBe(true)
  })

  it("disposes active plugin registrations when rediscovery makes them incompatible", async () => {
    const compatibleManifest: PluginManifest = {
      id: "official.rediscover-incompatible",
      name: "Official Rediscover Incompatible",
      version: "0.0.0",
      apiVersion: "1.0.0",
      supportedPlatforms: ["web"],
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {},
    }
    const incompatibleManifest: PluginManifest = {
      ...compatibleManifest,
      supportedPlatforms: ["desktop-webview"],
    }

    const kernel = createPluginKernel({ hostPlatform: "web" })
    await kernel.discover([
      {
        manifest: compatibleManifest,
        enabled: true,
        activate(context) {
          context.registry.views.register("official.rediscover-incompatible.view", () => null)
        },
      },
    ])
    await kernel.activateEnabledPlugins()

    expect(kernel.registry.views.has("official.rediscover-incompatible.view")).toBe(true)

    await kernel.discover([
      {
        manifest: incompatibleManifest,
        enabled: true,
        activate() {},
      },
    ])

    expect(kernel.plugins[0]!.enabled).toBe(false)
    expect(kernel.registry.views.has("official.rediscover-incompatible.view")).toBe(false)
  })

  it("skips plugins when the host platform is unsupported", async () => {
    const saved: Array<{ id: string; status: string; disabledReason: string | undefined }> = []
    const manifest: PluginManifest = {
      id: "desktop.only",
      name: "Desktop Only",
      version: "0.0.0",
      apiVersion: "1.0.0",
      supportedPlatforms: ["desktop-webview"],
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {},
    }
    let activated = false

    const kernel = createPluginKernel({
      hostPlatform: "web",
      hostCapabilities: {
        externalOpen: true,
        themeApply: true,
        backgroundApply: true,
        importExportWorkspace: true,
        clipboard: true,
        localFile: false,
        network: true,
        storage: true,
      },
      lifecycleStore: {
        async save(record) {
          saved.push({
            id: record.id,
            status: record.status,
            disabledReason: record.disabledReason,
          })
        },
      },
    })

    await kernel.discover([
      {
        manifest,
        enabled: true,
        activate() {
          activated = true
        },
      },
    ])
    await kernel.activateEnabledPlugins()

    expect(activated).toBe(false)
    expect(kernel.plugins[0]!.enabled).toBe(false)
    expect(saved.at(-1)).toEqual({
      id: "desktop.only",
      status: "skipped",
      disabledReason: 'Unsupported platform "web"',
    })
  })

  it("skips plugins when required capabilities are missing", async () => {
    const saved: Array<{ id: string; status: string; disabledReason: string | undefined }> = []
    const manifest: PluginManifest = {
      id: "network.plugin",
      name: "Network Plugin",
      version: "0.0.0",
      apiVersion: "1.0.0",
      supportedPlatforms: ["web"],
      requiredCapabilities: ["network", "clipboard"],
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {},
    }
    let activated = false

    const kernel = createPluginKernel({
      hostPlatform: "web",
      hostCapabilities: {
        externalOpen: true,
        themeApply: true,
        backgroundApply: true,
        importExportWorkspace: true,
        clipboard: false,
        localFile: false,
        network: true,
        storage: true,
      },
      lifecycleStore: {
        async save(record) {
          saved.push({
            id: record.id,
            status: record.status,
            disabledReason: record.disabledReason,
          })
        },
      },
    })

    await kernel.discover([
      {
        manifest,
        enabled: true,
        activate() {
          activated = true
        },
      },
    ])
    await kernel.activateEnabledPlugins()

    expect(activated).toBe(false)
    expect(kernel.plugins[0]!.enabled).toBe(false)
    expect(saved.at(-1)).toEqual({
      id: "network.plugin",
      status: "skipped",
      disabledReason: "Missing host capabilities: clipboard",
    })
  })

  it("activates plugins when required capabilities are satisfied", async () => {
    const manifest: PluginManifest = {
      id: "network.plugin",
      name: "Network Plugin",
      version: "0.0.0",
      apiVersion: "1.0.0",
      supportedPlatforms: ["web"],
      requiredCapabilities: ["network", "clipboard"],
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {},
    }
    let activated = false

    const kernel = createPluginKernel({
      hostPlatform: "web",
      hostCapabilities: {
        externalOpen: true,
        themeApply: true,
        backgroundApply: true,
        importExportWorkspace: true,
        clipboard: true,
        localFile: false,
        network: true,
        storage: true,
      },
    })

    await kernel.discover([
      {
        manifest,
        enabled: true,
        activate() {
          activated = true
        },
      },
    ])
    await kernel.activateEnabledPlugins()

    expect(activated).toBe(true)
  })

  it("does not activate incompatible plugins when manually enabled", async () => {
    const saved: Array<{ id: string; enabled: boolean; status: string; disabledReason?: string }> =
      []
    const manifest: PluginManifest = {
      id: "desktop.only",
      name: "Desktop Only",
      version: "0.0.0",
      apiVersion: "1.0.0",
      supportedPlatforms: ["desktop-webview"],
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {},
    }
    let activated = false

    const kernel = createPluginKernel({
      hostPlatform: "web",
      hostCapabilities: {
        externalOpen: true,
        themeApply: true,
        backgroundApply: true,
        importExportWorkspace: true,
        clipboard: true,
        localFile: false,
        network: true,
        storage: true,
      },
      lifecycleStore: {
        async save(record) {
          saved.push({
            id: record.id,
            enabled: record.enabled,
            status: record.status,
            ...(record.disabledReason ? { disabledReason: record.disabledReason } : {}),
          })
        },
      },
    })

    await kernel.discover([
      {
        manifest,
        enabled: false,
        activate() {
          activated = true
        },
      },
    ])
    await kernel.setPluginEnabled("desktop.only", true)

    expect(activated).toBe(false)
    expect(saved.at(-1)).toEqual({
      id: "desktop.only",
      enabled: false,
      status: "skipped",
      disabledReason: 'Unsupported platform "web"',
    })
  })
})
