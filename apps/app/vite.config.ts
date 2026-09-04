import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { tanstackStart } from "@tanstack/solid-start/plugin/vite"
import { defineConfig } from "vite"
import solid from "vite-plugin-solid"

import { taboraBrandFavicon } from "@tabora/brand/vite"
import { createTaboraStylexVitePlugin } from "@tabora/stylex-config"

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..")

export default defineConfig(({ command }) => ({
  base: "/",
  // @tanstack/ai-solid/ui exports TSX source through its `solid` condition.
  // Let vite-plugin-solid transform it instead of dependency pre-bundling JSX as .js.
  optimizeDeps: {
    exclude: ["@tanstack/ai-solid"],
  },
  plugins: [
    createTaboraStylexVitePlugin({
      rootDir: workspaceRoot,
      dev: command === "serve",
      devMode: command === "serve" ? "full" : "off",
    }),
    tanstackStart({
      router: {
        // 管理页路由本身位于 /admin；保持 router basepath 在根路径，确保 /api 不被前缀化。
        basepath: "/",
      },
      spa: {
        enabled: true,
      },
    }),
    solid({ ssr: true }),
    taboraBrandFavicon(),
  ],
}))
