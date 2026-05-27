import { describe, expect, it } from "vitest"
import type { PluginInstance, WidgetSize } from "@tabora/plugin-api"
import { assignGridOrder } from "./workbenchGrid"

function instance(id: string, size: WidgetSize): PluginInstance {
  return {
    id,
    pluginId: "official.widgets.productivity",
    contributionId: "notes",
    extensionPoint: "widget",
    regionId: "mainGrid",
    enabled: true,
    size,
    config: {},
    createdAt: "2026-05-26T00:00:00.000Z",
    updatedAt: "2026-05-26T00:00:00.000Z",
  }
}

describe("assignGridOrder", () => {
  it("stores visual order as grid placement metadata", () => {
    const ordered = assignGridOrder(
      [instance("notes", "M"), instance("weather", "S")],
      "2026-05-27T00:00:00.000Z",
    )

    expect(ordered).toMatchObject([
      {
        id: "notes",
        grid: { x: 0, y: 0, colSpan: 2, rowSpan: 1 },
        updatedAt: "2026-05-27T00:00:00.000Z",
      },
      {
        id: "weather",
        grid: { x: 1, y: 0, colSpan: 1, rowSpan: 1 },
        updatedAt: "2026-05-27T00:00:00.000Z",
      },
    ])
  })
})
