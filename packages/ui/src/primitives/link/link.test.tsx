import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"

import { Link } from "./link"

describe("Link", () => {
  it("spreads raw DOM attrs onto the anchor host", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <Link href="/docs" attrs={{ class: "custom", style: "width:120px" }}>
          文档
        </Link>
      ),
      root,
    )

    const link = root.querySelector("a") as HTMLAnchorElement
    expect(link.className).toBe("custom")
    expect(link.getAttribute("style")).toMatch(/120(?:px)?/)
  })
})
