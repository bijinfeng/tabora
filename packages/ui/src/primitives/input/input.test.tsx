import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { Input } from "../../styled/input/input.styled"

describe("Input", () => {
  it("renders controlled value and calls onInput", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onInput = vi.fn()
    render(
      () => <Input value="hello" onInput={onInput} aria-label="搜索" placeholder="输入" />,
      root,
    )
    const el = root.querySelector("input")!
    expect(el.value).toBe("hello")
    expect(el.placeholder).toBe("输入")
    expect(el.getAttribute("aria-label")).toBe("搜索")
    el.value = "world"
    el.dispatchEvent(new Event("input", { bubbles: true }))
    expect(onInput).toHaveBeenCalledWith("world")
  })
  it("blocks input while disabled", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Input value="" onInput={() => {}} disabled aria-label="x" />, root)
    expect(root.querySelector("input")!.disabled).toBe(true)
  })

  it("uses StyleX classes while preserving input state attributes", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => <Input value="hello" onInput={() => {}} size="sm" invalid aria-label="搜索" />,
      root,
    )

    const el = root.querySelector("input")!
    expect(el.className).not.toContain("tbr-input")
    expect(el.className.length).toBeGreaterThan(0)
    expect(el.getAttribute("data-size")).toBe("sm")
    expect(el.hasAttribute("data-invalid")).toBe(true)
  })
})
