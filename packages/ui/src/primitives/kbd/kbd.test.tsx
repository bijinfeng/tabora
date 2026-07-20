import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"

import { Kbd } from "./kbd"

describe("Kbd", () => {
  it("spreads raw DOM attrs onto the keyboard host", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Kbd attrs={{ class: "custom", style: "width:36px" }}>K</Kbd>, root)

    const el = root.querySelector("kbd") as HTMLElement
    expect(el.className).toBe("custom")
    expect(el.getAttribute("style")).toMatch(/36(?:px)?/)
  })
})
