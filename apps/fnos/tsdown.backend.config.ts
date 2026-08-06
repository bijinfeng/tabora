import { defineConfig } from "tsdown"

export default defineConfig({
  entry: ["backend/src/server.ts"],
  outDir: "dist/server",
  format: "esm",
  platform: "node",
  target: "node22",
  deps: {
    alwaysBundle: [/.*/],
    neverBundle: ["better-sqlite3"],
    onlyBundle: false,
  },
})
