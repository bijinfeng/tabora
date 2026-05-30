import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { Select } from "./select"

describe("Select", () => {
  it("renders trigger with current label and aria-label", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Select<"a" | "b">
          value="a"
          options={[
            { value: "a", label: "Apple" },
            { value: "b", label: "Banana" },
          ]}
          onChange={() => {}}
          aria-label="水果"
        />
      ),
      root,
    )
    const trigger = root.querySelector("button[aria-label='水果']")!
    expect(trigger.textContent).toContain("Apple")
  })
  it("respects disabled", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Select<"a">
          value="a"
          disabled
          options={[{ value: "a", label: "Apple" }]}
          onChange={() => {}}
          aria-label="水果"
        />
      ),
      root,
    )
    expect(root.querySelector("button")!.disabled).toBe(true)
  })
})
