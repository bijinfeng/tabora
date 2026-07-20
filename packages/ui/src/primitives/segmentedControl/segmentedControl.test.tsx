import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { SegmentedControl } from "./segmentedControl"
import { SegmentedControl as StyledSegmentedControl } from "../../styled/segmentedControl/segmentedControl.styled"

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

  it("uses StyleX classes while preserving selected and size state", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <StyledSegmentedControl<"S" | "M">
          value="M"
          onChange={() => {}}
          size="sm"
          aria-label="尺寸"
          options={[
            { value: "S", label: "S" },
            { value: "M", label: "M" },
          ]}
        />
      ),
      root,
    )

    const segmented = root.firstElementChild as HTMLElement
    const selected = [...root.querySelectorAll("button")].find((button) =>
      button.hasAttribute("data-pressed"),
    )!
    expect(segmented.className).not.toContain("tbr-segmented")
    expect(segmented.className.length).toBeGreaterThan(0)
    expect(segmented.getAttribute("data-size")).toBe("sm")
    expect(selected.className).not.toContain("tbr-segmented-item")
    expect(selected.className.length).toBeGreaterThan(0)
  })
})
