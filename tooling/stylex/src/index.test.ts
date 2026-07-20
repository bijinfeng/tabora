import { describe, expect, it } from "vitest"

import { createTaboraStylexVitePlugin, stylexSharedOptions } from "./index"

describe("StyleX shared config", () => {
  it("enables CSS layers and uses the official StyleX import source", () => {
    expect(stylexSharedOptions).toMatchObject({
      importSources: ["@stylexjs/stylex"],
      useCSSLayers: true,
    })
  })

  it("creates a Vite plugin with development middleware disabled for tests", () => {
    const plugin = createTaboraStylexVitePlugin({
      dev: false,
      devMode: "off",
      rootDir: "/repo",
    })

    expect(plugin).toBeDefined()
  })
})
