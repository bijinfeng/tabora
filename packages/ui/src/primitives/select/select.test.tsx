import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { Select } from "./select"
import { Select as StyledSelect } from "../../styled/select/select.styled"

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

  it("uses StyleX classes for a single-select trigger while preserving invalid state", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <StyledSelect<"a" | "b">
          value="a"
          invalid
          size="sm"
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
    expect(trigger.className).not.toContain("tbr-select")
    expect(trigger.className.length).toBeGreaterThan(0)
    expect(trigger.getAttribute("data-size")).toBe("sm")
    expect(trigger.hasAttribute("data-invalid")).toBe(true)
    expect(root.querySelector("[class*='tbr-select']")).toBeNull()
  })

  it("uses StyleX classes for multi-select tags while preserving multiple state", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <StyledSelect<"a" | "b">
          multiple
          value={["a"]}
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
    const remove = root.querySelector("button[aria-label='移除 Apple']")!
    expect(trigger.hasAttribute("data-multiple")).toBe(true)
    expect(trigger.className).not.toContain("tbr-select")
    expect(remove.className).not.toContain("tbr-select-tag-remove")
    expect(remove.className.length).toBeGreaterThan(0)
    expect(root.querySelector("[class*='tbr-select']")).toBeNull()
  })
})
