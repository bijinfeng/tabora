import "@wxt-dev/auto-icons"
import { taboraAppIconPath } from "@tabora/brand/assetPaths"
import { defineConfig } from "wxt"
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  modules: ["@wxt-dev/module-solid", "@wxt-dev/auto-icons"],
  autoIcons: {
    baseIconPath: taboraAppIconPath,
    sizes: [16, 32, 48, 128],
    developmentIndicator: false,
  },
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
  }),
})
