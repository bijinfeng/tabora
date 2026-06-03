import { defineConfig } from "wxt"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  modules: ["@wxt-dev/module-solid"],
  manifest: {
    name: "Tabora",
    description: "插件优先的个人工作台新标签页",
    permissions: ["storage"],
    chrome_url_overrides: {
      newtab: "newtab.html",
    },
  },
  vite: () => ({
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@tabora/playground/src": path.resolve(__dirname, "../playground/src"),
      },
    },
  }),
})
