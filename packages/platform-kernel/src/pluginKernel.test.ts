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
})
