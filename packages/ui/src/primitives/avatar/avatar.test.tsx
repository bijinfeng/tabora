import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"

import { Avatar } from "./avatar"

describe("Avatar", () => {
  it("spreads raw attrs to root and image slots", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <Avatar
          src="/avatar.png"
          alt="Tabora"
          attrs={{ class: "avatar", style: "width:40px" }}
          imgAttrs={{ class: "image", style: "height:40px" }}
        />
      ),
      root,
    )

    const host = root.querySelector("span") as HTMLSpanElement
    const image = root.querySelector("img") as HTMLImageElement
    expect(host.className).toBe("avatar")
    expect(host.getAttribute("style")).toMatch(/40(?:px)?/)
    expect(image.className).toBe("image")
    expect(image.getAttribute("style")).toMatch(/40(?:px)?/)
  })
})
