import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { Checkbox } from "./checkbox"
import { Checkbox as StyledCheckbox } from "../../styled/checkbox/checkbox.styled"

describe("Checkbox", () => {
  it("calls onChange when toggled", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onChange = vi.fn()
    render(() => <Checkbox checked={false} onChange={onChange} aria-label="完成" />, root)
    const input = root.querySelector("input[type='checkbox']") as HTMLInputElement
    input.click()
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it("uses StyleX classes while preserving checked state", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <StyledCheckbox checked="indeterminate" onChange={() => {}} label="完成" />, root)

    const checkbox = root.querySelector("[data-indeterminate]") as HTMLElement
    expect(checkbox.className).not.toContain("tbr-checkbox")
    expect(checkbox.className.length).toBeGreaterThan(0)
    expect(root.querySelector("[class*='tbr-checkbox']")).toBeNull()
  })
})
