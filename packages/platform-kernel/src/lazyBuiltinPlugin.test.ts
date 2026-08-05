import type { PluginManifest } from "@tabora/plugin-api"
import { describe, expect, it } from "vitest"

import { createLazyBuiltinPlugin } from "./lazyBuiltinPlugin"

const manifest: PluginManifest = {
  id: "official.lazy-test",
  name: "Lazy Test",
  version: "0.0.0",
  apiVersion: "1.0.0",
  entry: "./entry",
  engine: { platform: "^0.1.0" },
  contributes: {},
}

describe("createLazyBuiltinPlugin", () => {
  it("defers and caches the implementation load before delegating activation", async () => {
    let loadCount = 0
    let activationCount = 0
    const plugin = createLazyBuiltinPlugin({
      manifest,
      async load() {
        loadCount += 1
        return {
          manifest,
          activate() {
            activationCount += 1
          },
        }
      },
    })

    expect(loadCount).toBe(0)

    await Promise.all([plugin.preload!(), plugin.preload!()])
    await plugin.module.activate({} as never)

    expect(loadCount).toBe(1)
    expect(activationCount).toBe(1)
  })

  it("rejects an implementation whose manifest does not match the descriptor", async () => {
    const plugin = createLazyBuiltinPlugin({
      manifest,
      async load() {
        return {
          manifest: { ...manifest, id: "official.wrong-plugin" },
          activate() {},
        }
      },
    })

    await expect(plugin.preload!()).rejects.toThrow(
      'Lazy plugin manifest mismatch: expected "official.lazy-test", received "official.wrong-plugin"',
    )
  })
})
