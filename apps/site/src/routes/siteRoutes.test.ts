import { readFileSync } from "node:fs"
import { dirname, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { describe, expect, it } from "vitest"

import { siteRoutePaths } from "./siteRoutePaths"

const routesDir = dirname(fileURLToPath(import.meta.url))

describe("site routes", () => {
  it("keeps top-level and docs routes declared in the route slice", () => {
    expect(siteRoutePaths).toEqual([
      "/",
      "/download",
      "/docs",
      "/docs/components",
      "/docs/components/:componentId",
      "/docs/:sectionId",
    ])
  })

  it("registers every declared route with the router", () => {
    const siteRoutesSource = readFileSync(resolve(routesDir, "siteRoutes.tsx"), "utf8")

    siteRoutePaths.forEach((_, index) => {
      expect(siteRoutesSource).toContain(`siteRoutePaths[${index}]`)
    })
  })
})
