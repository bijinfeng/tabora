import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { InlineError } from "./inlineError"

describe("InlineError", () => {
  it("uses role=alert and renders content", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <InlineError>失败</InlineError>, root)
    const el = root.querySelector("[role='alert']")!
    expect(el.textContent).toBe("失败")
  })

  it("spreads raw DOM attrs onto the alert host", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => <InlineError attrs={{ class: "custom", style: "width:160px" }}>失败</InlineError>,
      root,
    )

    const el = root.querySelector("[role='alert']") as HTMLElement
    expect(el.className).toBe("custom")
    expect(el.getAttribute("style")).toMatch(/160(?:px)?/)
  })
})
