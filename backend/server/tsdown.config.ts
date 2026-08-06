import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["src/main.ts"],
  outDir: "dist",
  format: "esm",
  platform: "node",
  target: "node22",
  deps: {
    alwaysBundle: [/.*/],
    neverBundle: ["better-sqlite3", "pg"],
    onlyBundle: false,
  },
})
