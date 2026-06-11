import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import solid from "vite-plugin-solid"

import { taboraBrandFavicon } from "@tabora/brand/vite"

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..")

export default defineConfig({
  plugins: [solid(), tailwindcss(), taboraBrandFavicon()],
  server: {
    fs: {
      allow: [workspaceRoot],
    },
  },
})
