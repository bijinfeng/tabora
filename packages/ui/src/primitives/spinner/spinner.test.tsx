import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { Spinner } from "./spinner"

describe("Spinner", () => {
  it("has role=status and default aria-label", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Spinner />, root)
    const el = root.querySelector("[role='status']")!
    expect(el.getAttribute("aria-label")).toBe("加载中")
  })

  it("spreads raw DOM attrs onto the status host", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(() => <Spinner attrs={{ class: "custom", style: "width:18px" }} />, root)

    const el = root.querySelector("[role='status']") as HTMLElement
    expect(el.className).toBe("custom")
    expect(el.getAttribute("style")).toMatch(/18(?:px)?/)
  })
})
