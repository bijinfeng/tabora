import { defineConfig } from "vite"
import solid from "vite-plugin-solid"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { copyFileSync, existsSync } from "node:fs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    solid(),
    tailwindcss(),
    {
      name: "extension-build",
      closeBundle() {
        const manifestSrc = path.resolve(__dirname, "public/manifest.json")
        const manifestDest = path.resolve(__dirname, "dist/manifest.json")
        if (existsSync(manifestSrc)) {
          copyFileSync(manifestSrc, manifestDest)
        }
      },
    },
  ],
  root: __dirname,
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "newtab.html"),
    },
  },
  resolve: {
    alias: {
      "@tabora/playground/src": path.resolve(__dirname, "../playground/src"),
    },
  },
})
