import { describe, expect, it, vi } from "vitest"

import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"

import {
  createTaboraStylexPackPlugins,
  createTaboraStylexVitePlugin,
  resolveStylexCssAsset,
  stylexSharedOptions,
  taboraStylexWorkspaceRoot,
} from "./index"

describe("StyleX shared config", () => {
  it("enables CSS layers and uses the official StyleX import source", () => {
    expect(stylexSharedOptions).toMatchObject({
      importSources: ["@stylexjs/stylex"],
      useCSSLayers: {
        prefix: "tabora",
      },
    })
  })

  it("creates a Vite plugin with development middleware disabled for tests", () => {
    const plugin = createTaboraStylexVitePlugin({
      dev: false,
      devMode: "off",
      rootDir: "/repo",
    })
    const use = vi.fn()
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval").mockReturnValue(1 as never)

    expect(plugin.configureServer).toBeTypeOf("function")
    if (typeof plugin.configureServer === "function") {
      plugin.configureServer({
        httpServer: null,
        middlewares: { use },
      } as never)
    }

    expect(plugin).toBeDefined()
    expect(use).not.toHaveBeenCalled()
    expect(setIntervalSpy).not.toHaveBeenCalled()
    setIntervalSpy.mockRestore()
  })

  it("creates a three-plugin pack pipeline for a StyleX package stylesheet", () => {
    const uiPackageDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../../packages/ui")

    expect(resolveStylexCssAsset(uiPackageDir)).toMatchObject({
      publishFileName: "styles.css",
    })
    expect(
      createTaboraStylexPackPlugins({
        packageDir: uiPackageDir,
        rootDir: taboraStylexWorkspaceRoot,
      }),
    ).toHaveLength(3)
  })
})
