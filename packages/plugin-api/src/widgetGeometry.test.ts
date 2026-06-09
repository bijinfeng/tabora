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
      S: { colSpan: 1, rowSpan: 1 },
      M: { colSpan: 2, rowSpan: 1 },
      L: { colSpan: 2, rowSpan: 2 },
      XL: { colSpan: 2, rowSpan: 2 },
    })

    expect(widgetGridSpan("M")).toEqual({ colSpan: 2, rowSpan: 1 })
    expect(widgetGridColumnSpan("L")).toBe(2)
    expect(widgetGridRowSpan("XL")).toBe(2)
  })
})
