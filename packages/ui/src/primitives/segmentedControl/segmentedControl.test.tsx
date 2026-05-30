import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { SegmentedControl } from "./segmentedControl"

describe("SegmentedControl", () => {
  it("calls onChange when clicking another option", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onChange = vi.fn()
    render(
      () => (
        <SegmentedControl<"S" | "M" | "L">
          value="M"
          onChange={onChange}
          aria-label="尺寸"
          options={[
            { value: "S", label: "S" },
            { value: "M", label: "M" },
            { value: "L", label: "L" },
          ]}
        />
      ),
      root,
    )
    const buttons = root.querySelectorAll("button")
    const second = [...buttons].find((b) => b.textContent === "S")!
    second.click()
    expect(onChange).toHaveBeenCalledWith("S")
  })
})
