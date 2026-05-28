import { describe, expect, it } from "vitest"
import {
  WORKBENCH_RAIL_ACTIONS,
  findLayoutContribution,
  findSearchContribution,
} from "./workbenchShell"

const plugins = [
  {
    manifest: {
      id: "official.layout.workbench-dashboard",
      contributes: {
        layouts: [
          {
            id: "official.layout.workbench-dashboard",
            title: "Workbench Dashboard",
            view: "official.layout.workbench-dashboard.view",
            regions: [],
            defaultRegions: {},
            supportsResponsive: true,
          },
        ],
      },
    },
  },
  {
    manifest: {
      id: "official.search.command-bar",
      contributes: {
        searches: [
          {
            id: "official.search.command-bar",
            title: "Command Search",
            view: "official.search.command-bar.view",
          },
        ],
      },
    },
  },
]

describe("workbench shell composition", () => {
  it("finds the dashboard layout contribution by layout id", () => {
    const layout = findLayoutContribution(plugins, "official.layout.workbench-dashboard")

    expect(layout?.view).toBe("official.layout.workbench-dashboard.view")
  })

  it("finds the command search contribution by plugin and contribution id", () => {
    const search = findSearchContribution(
      plugins,
      "official.search.command-bar",
      "official.search.command-bar",
    )

    expect(search?.view).toBe("official.search.command-bar.view")
  })

  it("keeps rail entry points actionable instead of disabled placeholders", () => {
    expect(WORKBENCH_RAIL_ACTIONS).toEqual([
      expect.objectContaining({ id: "home", isActive: true }),
      expect.objectContaining({ id: "add-widget", targetId: "add-widgets" }),
      expect.objectContaining({ id: "plugins", modalViewId: "official.plugin-manager.card" }),
      expect.objectContaining({ id: "settings", modalViewId: "official.plugin-manager.card" }),
    ])
  })
})
