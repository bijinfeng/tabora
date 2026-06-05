import { describe, expect, it } from "vitest"
import type { PluginManifest } from "@tabora/plugin-api"
import { createPluginKernel } from "./pluginKernel"

describe("createPluginKernel", () => {
  it("activates enabled plugins and exposes registered views", async () => {
    const manifest: PluginManifest = {
      id: "official.test",
      name: "Official Test",
      version: "0.0.0",
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
        legacyMigration: false,
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
        legacyMigration: false,
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
        legacyMigration: false,
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
        legacyMigration: false,
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
