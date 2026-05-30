import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { Checkbox } from "./checkbox"

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
})
