import { describe, expect, it } from "vitest"

import { siteRoutePaths } from "./siteRoutePaths"

describe("site routes", () => {
  it("keeps top-level and docs routes declared in the route slice", () => {
    expect(siteRoutePaths).toEqual([
      "/",
      "/download",
      "/docs",
      "/docs/components",
      "/docs/components/:componentId",
    ])
  })
})
