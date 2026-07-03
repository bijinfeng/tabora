import { describe, expect, it } from "vitest"

import {
  WIDGET_GRID_GEOMETRY,
  widgetGridColumnSpan,
  widgetGridRowSpan,
  widgetGridSpan,
} from "./widgetGeometry"

describe("widget grid geometry", () => {
  it("exposes a single grid span contract for every widget size", () => {
    expect(WIDGET_GRID_GEOMETRY).toEqual({
      S: { colSpan: 3, rowSpan: 1 },
      M: { colSpan: 4, rowSpan: 1 },
      L: { colSpan: 6, rowSpan: 1 },
      XL: { colSpan: 8, rowSpan: 1 },
    })

    expect(widgetGridSpan("M")).toEqual({ colSpan: 4, rowSpan: 1 })
    expect(widgetGridColumnSpan("L")).toBe(6)
    expect(widgetGridRowSpan("XL")).toBe(1)
  })
})
