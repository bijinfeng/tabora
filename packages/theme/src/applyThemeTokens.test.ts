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

  it("mirrors shell theme tokens to Tabora UI component tokens", () => {
    const element = document.createElement("div")

    applyThemeTokens(element, {
      "color-surface": "37 41 39",
      "color-text": "237 240 237",
      "color-muted": "182 186 182",
      "color-subtle": "134 139 134",
      "color-line": "59 64 60",
      "color-inverse": "255 255 255",
      "color-shadow": "0 0 0",
      "radius-control": "8px",
      "radius-panel": "12px",
      "control-sm": "30px",
      "control-lg": "44px",
      "dur-normal": "180ms",
    })

    expect(element.style.getPropertyValue("--tbr-color-surface")).toBe("37 41 39")
    expect(element.style.getPropertyValue("--tbr-color-text")).toBe("237 240 237")
    expect(element.style.getPropertyValue("--tbr-color-text-muted")).toBe("182 186 182")
    expect(element.style.getPropertyValue("--tbr-color-text-subtle")).toBe("134 139 134")
    expect(element.style.getPropertyValue("--tbr-color-line")).toBe("59 64 60")
    expect(element.style.getPropertyValue("--tbr-color-inverse")).toBe("255 255 255")
    expect(element.style.getPropertyValue("--tbr-color-shadow")).toBe("0 0 0")
    expect(element.style.getPropertyValue("--tbr-radius-control")).toBe("8px")
    expect(element.style.getPropertyValue("--tbr-radius-panel")).toBe("12px")
    expect(element.style.getPropertyValue("--tbr-control-sm")).toBe("30px")
    expect(element.style.getPropertyValue("--tbr-control-lg")).toBe("44px")
    expect(element.style.getPropertyValue("--tbr-dur-normal")).toBe("180ms")
  })
})
