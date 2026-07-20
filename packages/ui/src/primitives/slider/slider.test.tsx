import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { Slider } from "../../styled/slider/slider.styled"

describe("Slider", () => {
  it("renders an accessible slider with the current value", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => <Slider value={42} min={0} max={100} onChange={() => {}} aria-label="透明度" />,
      root,
    )

    const thumb = root.querySelector("[role='slider']") as HTMLElement
    expect(thumb).toBeTruthy()
    expect(thumb.getAttribute("aria-valuenow")).toBe("42")
  })

  it("uses StyleX classes without old slider classes", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Slider value={50} onChange={() => {}} aria-label="透明度" />, root)

    const slider = root.firstElementChild as HTMLElement
    const thumb = root.querySelector("[role='slider']") as HTMLElement
    expect(slider.className).not.toContain("tbr-slider")
    expect(slider.className.length).toBeGreaterThan(0)
    expect(thumb.className).not.toContain("tbr-slider-thumb")
    expect(thumb.className.length).toBeGreaterThan(0)
    expect(root.querySelector("[class*='tbr-slider']")).toBeNull()
  })
})
