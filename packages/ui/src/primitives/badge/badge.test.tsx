import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { Badge } from "./badge"

describe("Badge", () => {
  it("renders with variant attr", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Badge variant="accent">Demo</Badge>, root)
    const el = root.querySelector("span")!
    expect(el.getAttribute("data-variant")).toBe("accent")
    expect(el.textContent).toBe("Demo")
  })

  it("spreads raw DOM attrs onto the badge host", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Badge attrs={{ class: "custom", style: "width:48px" }}>Demo</Badge>, root)

    const el = root.querySelector("span") as HTMLSpanElement
    expect(el.className).toBe("custom")
    expect(el.getAttribute("style")).toMatch(/48(?:px)?/)
  })
})
