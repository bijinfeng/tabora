import { describe, expect, it } from "vitest"

import { applyBackgroundStyle, resolveBackgroundStyle } from "./backgroundResolver"

describe("backgroundResolver", () => {
  it("uses a safe page color for unknown providers", () => {
    expect(resolveBackgroundStyle("missing", [])).toEqual({ background: "rgb(var(--color-page))" })
  })

  it("removes CSS properties owned only by the previous background", () => {
    const element = document.createElement("div")
    applyBackgroundStyle({ background: "red", "background-image": "url(first.png)" }, element)
    applyBackgroundStyle({ background: "blue" }, element)

    expect(element.style.getPropertyValue("background")).toBe("blue")
    expect(element.style.getPropertyValue("background-image")).not.toContain("first.png")
  })
})
