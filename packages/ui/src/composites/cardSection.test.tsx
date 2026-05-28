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
})
