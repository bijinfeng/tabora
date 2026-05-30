import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { Badge } from "../primitives/badge/badge"

describe("Badge", () => {
  it("renders with variant attr", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Badge variant="accent">Demo</Badge>, root)
    const el = root.querySelector("span")!
    expect(el.getAttribute("data-variant")).toBe("accent")
    expect(el.textContent).toBe("Demo")
  })
})
