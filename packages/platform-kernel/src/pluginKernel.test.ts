import { describe, expect, it } from "vitest"
import type { PluginManifest, PluginModule } from "@tabora/plugin-api"
import { createBuiltinPluginPackage, createPluginKernel } from "./pluginKernel"

function builtin(module: PluginModule, preload?: () => Promise<void>) {
  return createBuiltinPluginPackage(module, preload ? { preload } : {})
}

function withViews(manifest: PluginManifest, ...viewIds: string[]): PluginManifest {
  return {
    ...manifest,
    contributes: {
      ...manifest.contributes,
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

describe("createPluginKernel", () => {
  it("refuses remote-untrusted executable modules even when discover is called directly", async () => {
    const kernel = createPluginKernel()
    const manifest: PluginManifest = {
      id: "example.remote",
      name: "Remote",
      version: "1.0.0",
      apiVersion: "1.0.0",
      entry: "https://example.test/plugin.js",
      engine: { platform: "^0.1.0" },
      contributes: {},
    }

    await expect(
      kernel.discover([{ module: { manifest, activate() {} }, source: "remote-untrusted" }]),
    ).rejects.toThrow("Remote untrusted executable plugins require a sandboxed runtime")
  })

  it("rejects unresolved cross-plugin preset references during discovery", async () => {
    const kernel = createPluginKernel()
    const manifest: PluginManifest = {
      id: "example.preset",
      name: "Preset",
      version: "1.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^1.0.0" },
      contributes: {
        workspacePresets: [
          {
            id: "example.preset.default",
            title: "Default",
            plugins: ["missing.plugin"],
            layout: { pluginId: "missing.plugin", kind: "layout", id: "missing.layout" },
            theme: { pluginId: "missing.plugin", kind: "theme", id: "missing.theme" },
            backgroundProvider: {
              pluginId: "missing.plugin",
              kind: "background-provider",
              id: "missing.background",
            },
            search: {
              defaultProvider: {
                pluginId: "missing.plugin",
                kind: "search-provider",
                id: "missing.search",
              },
              enabledProviders: [
                { pluginId: "missing.plugin", kind: "search-provider", id: "missing.search" },
              ],
            },
            regions: [{ regionId: "main", accepts: ["widget"] }],
            instances: [
              {
                instanceId: "missing-instance",
                contribution: { pluginId: "missing.plugin", kind: "widget", id: "missing" },
                regionId: "main",
                size: "S",
              },
            ],
          },
        ],
      },
    }

    await expect(kernel.discover([builtin({ manifest, activate() {} })])).rejects.toThrow(
      "Invalid plugin manifest composition",
    )
  })

  it("starts enabled plugin preloads together and preserves activation order", async () => {
    const events: string[] = []
    let releaseFirst!: () => void
    let releaseSecond!: () => void
    const firstReady = new Promise<void>((resolve) => {
      releaseFirst = resolve
    })
    const secondReady = new Promise<void>((resolve) => {
      releaseSecond = resolve
    })
    const createManifest = (id: string): PluginManifest => ({
      id,
      name: id,
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {},
    })
    const kernel = createPluginKernel()

    await kernel.discover([
      builtin(
        {
          manifest: createManifest("official.preload-first"),
          activate() {
            events.push("activate:first")
          },
        },
        async () => {
          events.push("preload:first")
          await firstReady
        },
      ),
      builtin(
        {
          manifest: createManifest("official.preload-second"),
          activate() {
            events.push("activate:second")
          },
        },
        async () => {
          events.push("preload:second")
          await secondReady
        },
      ),
    ])

    const activation = kernel.activateEnabledPlugins()
    await Promise.resolve()

    expect(events).toEqual(["preload:first", "preload:second"])

    releaseSecond()
    releaseFirst()
    await activation

    expect(events).toEqual(["preload:first", "preload:second", "activate:first", "activate:second"])
  })

  it("isolates preload failures and continues activating later plugins", async () => {
    const saved: Array<{ id: string; status: string; lastError?: string }> = []
    const activations: string[] = []
    const createManifest = (id: string): PluginManifest => ({
      id,
      name: id,
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {},
    })
    const kernel = createPluginKernel({
      lifecycleStore: {
        async save(record) {
          saved.push({
            id: record.id,
            status: record.status,
            ...(record.lastError ? { lastError: record.lastError } : {}),
          })
        },
      },
    })

    await kernel.discover([
      builtin(
        {
          manifest: createManifest("official.preload-fails"),
          activate() {
            activations.push("failed")
          },
        },
        async () => {
          throw new Error("chunk missing")
        },
      ),
      builtin(
        {
          manifest: createManifest("official.preload-healthy"),
          activate() {
            activations.push("healthy")
          },
        },
        async () => {},
      ),
    ])

    await kernel.activateEnabledPlugins()

    expect(activations).toEqual(["healthy"])
    expect(saved).toContainEqual({
      id: "official.preload-fails",
      status: "error",
      lastError: "chunk missing",
    })
    expect(saved).toContainEqual({ id: "official.preload-healthy", status: "active" })
    expect(
      kernel.plugins.find((plugin) => plugin.manifest.id === "official.preload-fails")?.enabled,
    ).toBe(false)
  })

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
      builtin({
        manifest: withViews(manifest, "official.test.view"),
        activate(context) {
          context.views.register("official.test.view", () => null)
        },
      }),
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
      builtin({
        manifest: withViews(manifest, "official.cleanup.view"),
        activate(context) {
          context.views.register("official.cleanup.view", () => null)
        },
      }),
    ])
    await kernel.activateEnabledPlugins()

    expect(kernel.registry.views.has("official.cleanup.view")).toBe(true)

    await kernel.setPluginEnabled("official.cleanup", false)

    expect(kernel.registry.views.has("official.cleanup.view")).toBe(false)
  })

  it("registers declared command handlers and removes them when the plugin is disabled", async () => {
    const manifest: PluginManifest = {
      id: "official.command-test",
      name: "Command Test",
      version: "1.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^1.0.0" },
      contributes: {
        commands: [{ id: "official.command-test.run", title: "Run", category: "test" }],
      },
    }
    const calls: string[] = []
    const kernel = createPluginKernel()
    await kernel.discover([
      builtin({
        manifest,
        activate(context) {
          context.commands.register("official.command-test.run", (invocation) => {
            calls.push(invocation.source)
          })
        },
      }),
    ])
    await kernel.activateEnabledPlugins()

    expect(kernel.registry.commands.has("official.command-test.run")).toBe(true)
    await expect(
      kernel.registry.commands.execute("official.command-test.run", {
        commandId: "official.command-test.run",
        source: "palette",
      }),
    ).resolves.toBe(true)
    expect(calls).toEqual(["palette"])

    await kernel.setPluginEnabled("official.command-test", false)

    expect(kernel.registry.commands.has("official.command-test.run")).toBe(false)
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
      builtin({
        manifest,
        activate() {
          activationCount += 1
        },
      }),
    ])

    await kernel.activateEnabledPlugins()
    await kernel.activateEnabledPlugins()
    await kernel.setPluginEnabled("official.idempotent", true)

    expect(activationCount).toBe(1)
  })

  it("preloads a plugin again before activating it after a manual re-enable", async () => {
    const manifest: PluginManifest = {
      id: "official.reenable-preload",
      name: "Re-enable preload",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {},
    }
    let preloadCount = 0
    let activationCount = 0
    const kernel = createPluginKernel()

    await kernel.discover([
      builtin(
        {
          manifest,
          activate() {
            activationCount += 1
          },
        },
        async () => {
          preloadCount += 1
        },
      ),
    ])
    await kernel.activateEnabledPlugins()
    await kernel.setPluginEnabled("official.reenable-preload", false)
    await kernel.setPluginEnabled("official.reenable-preload", true)

    expect(preloadCount).toBe(2)
    expect(activationCount).toBe(2)
  })

  it("keeps a manually re-enabled plugin in error state when its preload fails", async () => {
    const manifest: PluginManifest = {
      id: "official.reenable-preload-failure",
      name: "Re-enable preload failure",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {},
    }
    let shouldFail = false
    let activationCount = 0
    const kernel = createPluginKernel()

    await kernel.discover([
      builtin(
        {
          manifest,
          activate() {
            activationCount += 1
          },
        },
        async () => {
          if (shouldFail) throw new Error("lazy chunk missing")
        },
      ),
    ])
    await kernel.activateEnabledPlugins()
    await kernel.setPluginEnabled("official.reenable-preload-failure", false)
    shouldFail = true
    await kernel.setPluginEnabled("official.reenable-preload-failure", true)

    expect(activationCount).toBe(1)
    expect(kernel.plugins[0]?.state).toEqual({ status: "error", error: "lazy chunk missing" })
    expect(kernel.plugins[0]?.enabled).toBe(false)
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
      builtin({
        manifest,
        activate() {
          return () => {
            disposeCount += 1
          }
        },
      }),
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
      builtin({
        manifest,
        activate() {
          throw new Error("activation exploded")
        },
      }),
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
      builtin({
        manifest: withViews(firstManifest, "official.rediscover.view"),
        activate(context) {
          context.views.register("official.rediscover.view", () => null)
        },
      }),
    ])
    await kernel.activateEnabledPlugins()

    expect(kernel.registry.views.has("official.rediscover.view")).toBe(true)

    await kernel.discover([
      builtin({
        manifest: withViews(replacementManifest, "official.rediscover.replacement"),
        activate(context) {
          replacementActivated = true
          context.views.register("official.rediscover.replacement", () => null)
        },
      }),
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
      builtin({
        manifest: withViews(compatibleManifest, "official.rediscover-incompatible.view"),
        activate(context) {
          context.views.register("official.rediscover-incompatible.view", () => null)
        },
      }),
    ])
    await kernel.activateEnabledPlugins()

    expect(kernel.registry.views.has("official.rediscover-incompatible.view")).toBe(true)

    await kernel.discover([
      builtin({
        manifest: incompatibleManifest,
        activate() {},
      }),
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
      builtin({
        manifest,
        activate() {
          activated = true
        },
      }),
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
      builtin({
        manifest,
        activate() {
          activated = true
        },
      }),
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
      builtin({
        manifest,
        activate() {
          activated = true
        },
      }),
    ])
    await kernel.activateEnabledPlugins()

    expect(activated).toBe(true)
  })

  it("skips network-permitted plugins unless the host supplies a network bridge", async () => {
    const manifest: PluginManifest = {
      id: "network.plugin",
      name: "Network Plugin",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      permissions: [{ type: "network", hosts: ["api.example.com"] }],
      contributes: {},
    }
    let activated = false
    const kernel = createPluginKernel({
      hostCapabilities: { network: true },
      permissionGrants: {
        "network.plugin": [{ type: "network", hosts: ["api.example.com"] }],
      },
    })

    await kernel.discover([
      builtin({
        manifest,
        activate() {
          activated = true
        },
      }),
    ])
    await kernel.activateEnabledPlugins()

    expect(activated).toBe(false)
    expect(kernel.plugins[0]?.state.disabledReason).toBe("Missing host network bridge")
  })

  it("passes the host AI bridge into authorized plugin activation contexts", async () => {
    const manifest: PluginManifest = {
      id: "official.ai-consumer",
      name: "AI Consumer",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      permissions: [{ type: "ai", access: ["generate"] }],
      contributes: {},
    }
    let generatedText: string | undefined

    const kernel = createPluginKernel({
      permissionGrants: {
        "official.ai-consumer": [{ type: "ai", access: ["generate"] }],
      },
      ai: {
        generate: async (request) => ({ text: `ai:${request.prompt}` }),
        stream: async function* () {},
      },
    })
    await kernel.discover([
      builtin({
        manifest,
        async activate(context) {
          generatedText = (await context.ai!.generate({ prompt: "hello" })).text
        },
      }),
    ])

    await kernel.activateEnabledPlugins()

    expect(generatedText).toBe("ai:hello")
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
      builtin({
        manifest,
        activate() {
          activated = true
        },
      }),
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
