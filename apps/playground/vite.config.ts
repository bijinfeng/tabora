import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { defineConfig } from "vite"
import solid from "vite-plugin-solid"

import { taboraBrandFavicon } from "@tabora/brand/vite"
import { createTaboraStylexVitePlugin } from "@tabora/stylex-config"

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..")

export default defineConfig(({ command }) => ({
  plugins: [
    createTaboraStylexVitePlugin({
      rootDir: workspaceRoot,
      dev: command === "serve",
      devMode: command === "serve" ? "full" : "off",
    }),
    solid(),
    taboraBrandFavicon(),
  ],
}))
