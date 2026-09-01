import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"

import { InputNumber } from "../../styled/inputNumber/inputNumber.styled"

function root() {
  const el = document.createElement("div")
  document.body.appendChild(el)
  return el
}

describe("InputNumber", () => {
  it("steps within its range and reports the resulting value", () => {
    const el = root()
    const onChange = vi.fn()
    const onStep = vi.fn()

    render(
      () => (
        <InputNumber
          defaultValue={2}
          min={1}
          max={3}
          onChange={onChange}
          onStep={onStep}
          aria-label="数量"
        />
      ),
      el,
    )

    el.querySelector<HTMLButtonElement>("button[aria-label='增加']")?.click()
    el.querySelector<HTMLButtonElement>("button[aria-label='增加']")?.click()

    expect(onChange).toHaveBeenCalledWith(3)
    expect(onStep).toHaveBeenCalledWith(3, { offset: 1, type: "up" })
    expect(el.querySelector<HTMLButtonElement>("button[aria-label='增加']")?.disabled).toBe(true)
  })

  it("parses, rounds, and clamps typed values", () => {
    const el = root()
    const onChange = vi.fn()

    render(
      () => (
        <InputNumber
          defaultValue={1}
          min={0}
          max={10}
          precision={1}
          parser={(value) => Number(value?.replace("件", ""))}
          onChange={onChange}
          controls={false}
          aria-label="库存"
        />
      ),
      el,
    )

    const input = el.querySelector<HTMLInputElement>("input")!
    input.value = "12.34件"
    input.dispatchEvent(new Event("input", { bubbles: true }))
    input.dispatchEvent(new FocusEvent("blur", { bubbles: true }))

    expect(onChange).toHaveBeenLastCalledWith(10)
    expect(input.value).toBe("10")
    expect(el.querySelector("button")).toBeNull()
  })

  it("uses StyleX output and supports keyboard stepping", () => {
    const el = root()
    const onChange = vi.fn()

    render(() => <InputNumber value={4} onChange={onChange} size="sm" aria-label="页码" />, el)

    const input = el.querySelector<HTMLInputElement>("input")!
    input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "ArrowUp" }))

    expect(onChange).toHaveBeenCalledWith(5)
    expect(el.querySelector("[data-tbr-input-number]")?.getAttribute("data-size")).toBe("sm")
    expect(input.className).not.toContain("tbr-input-number")
    expect(input.className.length).toBeGreaterThan(0)
  })
})
