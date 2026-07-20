import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"

import { Timeline } from "./timeline"

describe("Timeline", () => {
  it("spreads raw attrs to every item slot", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Timeline
          items={[{ title: "标题", description: "说明", meta: "刚刚" }]}
          attrs={{ class: "root" }}
          itemAttrs={{ class: "item" }}
          dotAttrs={{ class: "dot" }}
          bodyAttrs={{ class: "body" }}
          titleAttrs={{ class: "title" }}
          descriptionAttrs={{ class: "description" }}
          metaAttrs={{ class: "meta", style: "width:48px" }}
        />
      ),
      root,
    )

    expect(root.querySelector("ol")?.className).toBe("root")
    expect(root.querySelector("li")?.className).toBe("item")
    expect(root.querySelector("[aria-hidden='true']")?.className).toBe("dot")
    expect(root.querySelector("strong")?.parentElement?.className).toBe("body")
    expect(root.querySelector("strong")?.className).toBe("title")
    expect(root.querySelector("strong + span")?.className).toBe("description")
    expect(root.querySelector("small")?.className).toBe("meta")
    expect(root.querySelector("small")?.getAttribute("style")).toMatch(/48(?:px)?/)
  })
})
