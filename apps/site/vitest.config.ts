import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import solid from "vite-plugin-solid"
import { defineConfig } from "vitest/config"

import { createTaboraStylexVitePlugin } from "@tabora/stylex-config"

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")

export default defineConfig({
  plugins: [
    createTaboraStylexVitePlugin({
      rootDir: workspaceRoot,
      dev: false,
      devMode: "css-only",
    }),
    solid({ hot: false }),
  ],
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
})
