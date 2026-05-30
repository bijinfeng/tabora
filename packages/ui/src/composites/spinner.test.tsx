import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { Spinner } from "../primitives/spinner/spinner"

describe("Spinner", () => {
  it("has role=status and default aria-label", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Spinner />, root)
    const el = root.querySelector("[role='status']")!
    expect(el.getAttribute("aria-label")).toBe("加载中")
  })
})
