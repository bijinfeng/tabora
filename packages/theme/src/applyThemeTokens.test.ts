import { describe, expect, it } from "vitest"
import { applyThemeTokens } from "./applyThemeTokens"

describe("applyThemeTokens", () => {
  it("writes token values as CSS custom properties", () => {
    const element = document.createElement("div")

    applyThemeTokens(element, {
      "color-surface": "255 255 255",
      "radius-card": "12px",
    })

    expect(element.style.getPropertyValue("--color-surface")).toBe("255 255 255")
    expect(element.style.getPropertyValue("--radius-card")).toBe("12px")
  })
})
