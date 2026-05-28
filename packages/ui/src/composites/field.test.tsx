import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { Field } from "./field"

describe("Field", () => {
  it("renders label, helper, error and links to control via htmlFor", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Field label="今日重点" helper="一句话即可" htmlFor="focus-input">
          <input id="focus-input" />
        </Field>
      ),
      root,
    )
    const label = root.querySelector("label")!
    expect(label.htmlFor).toBe("focus-input")
    expect(root.textContent).toContain("今日重点")
    expect(root.textContent).toContain("一句话即可")
  })
  it("renders error with role=alert", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Field label="x" error="必填">
          <input />
        </Field>
      ),
      root,
    )
    const err = root.querySelector("[role='alert']")!
    expect(err.textContent).toBe("必填")
  })
})
