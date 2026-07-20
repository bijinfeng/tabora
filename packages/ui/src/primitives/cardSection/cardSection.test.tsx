import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { CardSection } from "./cardSection"

describe("CardSection", () => {
  it("renders title and trailing", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <CardSection title="标题" trailing={<span data-testid="t">尾</span>}>
          内容
        </CardSection>
      ),
      root,
    )
    expect(root.textContent).toContain("标题")
    expect(root.querySelector("[data-testid='t']")!.textContent).toBe("尾")
    expect(root.textContent).toContain("内容")
  })

  it("spreads raw attrs to every rendered slot", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <CardSection
          title="标题"
          trailing="尾"
          attrs={{ class: "root" }}
          headerAttrs={{ class: "header" }}
          titleAttrs={{ class: "title" }}
          trailingAttrs={{ class: "trailing" }}
          bodyAttrs={{ class: "body", style: "width:240px" }}
        >
          内容
        </CardSection>
      ),
      root,
    )

    expect(root.querySelector("section")?.className).toBe("root")
    expect(root.querySelector("header")?.className).toBe("header")
    expect(root.querySelector("h3")?.className).toBe("title")
    expect(root.querySelector("header div")?.className).toBe("trailing")
    expect(root.querySelector("section > div")?.className).toBe("body")
    expect(root.querySelector("section > div")?.getAttribute("style")).toMatch(/240(?:px)?/)
  })
})
