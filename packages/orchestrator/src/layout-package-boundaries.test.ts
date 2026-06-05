import { describe, expect, it } from "vitest"

import dashboardPackage from "../../../plugins/official/layout-dashboard/package.json" with { type: "json" }
import streamPackage from "../../../plugins/official/layout-stream/package.json" with { type: "json" }
import masonryPackage from "../../../plugins/community/layout-diy-masonry/package.json" with { type: "json" }

describe("layout package dependency boundaries", () => {
  it("layout packages do not depend on workbench shell internals", () => {
    for (const pkg of [dashboardPackage, streamPackage, masonryPackage]) {
      expect(pkg.dependencies).not.toHaveProperty("@tabora/workbench-shell")
    }
  })
})
