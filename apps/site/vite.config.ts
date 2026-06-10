import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from "vite"
import solid from "vite-plugin-solid"

import { taboraBrandFavicon } from "@tabora/brand/vite"

export default defineConfig({
  plugins: [solid(), tailwindcss(), taboraBrandFavicon()],
})
