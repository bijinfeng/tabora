import { createSignal } from "solid-js"
import { render } from "solid-js/web"
import { describe, expect, it, vi } from "vitest"

import { Stepper } from "./stepper.styled"

describe("Stepper", () => {
  it("renders the design-system structure and updates the controlled value", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const [value, setValue] = createSignal(4)

    render(
      () => (
        <Stepper
          value={value()}
          min={3}
          max={6}
          onChange={setValue}
          aria-label="默认卡片列数"
          decrementAriaLabel="减少默认卡片列数"
          incrementAriaLabel="增加默认卡片列数"
        />
      ),
      root,
    )

    const stepper = root.querySelector("[data-tbr-stepper]") as HTMLElement
    const decrement = root.querySelector("[data-stepper-decrement]") as HTMLButtonElement
    const increment = root.querySelector("[data-stepper-increment]") as HTMLButtonElement

    expect(stepper.getAttribute("aria-label")).toBe("默认卡片列数")
    expect(stepper.className.length).toBeGreaterThan(0)
    expect(decrement.className).toBe(increment.className)
    expect(root.querySelector("[data-stepper-value]")?.textContent?.trim()).toBe("4")

    increment.click()
    expect(value()).toBe(5)
    decrement.click()
    expect(value()).toBe(4)
  })

  it("disables boundary actions and does not emit out-of-range values", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onChange = vi.fn()

    render(() => <Stepper value={3} min={3} max={6} onChange={onChange} aria-label="列数" />, root)

    const decrement = root.querySelector("[data-stepper-decrement]") as HTMLButtonElement
    const increment = root.querySelector("[data-stepper-increment]") as HTMLButtonElement

    expect(decrement.disabled).toBe(true)
    expect(increment.disabled).toBe(false)
    decrement.click()
    expect(onChange).not.toHaveBeenCalled()
  })
})
