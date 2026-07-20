import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { Input } from "../../styled/input/input.styled"
import { HeadlessInput } from "./input"

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

  it("forwards raw DOM attrs to wrapper and leading icon slots", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(
      () => (
        <HeadlessInput
          value=""
          onInput={() => {}}
          aria-label="搜索"
          leadingIcon={<span>搜索图标</span>}
          wrapperAttrs={{ class: "wrapper", style: "width:144px" }}
          leadingIconAttrs={{ class: "leading", style: "color:rgb(1,2,3)" }}
        />
      ),
      root,
    )

    const wrapper = root.firstElementChild as HTMLElement
    const leadingIcon = wrapper.firstElementChild as HTMLElement
    expect(wrapper.className).toBe("wrapper")
    expect(wrapper.getAttribute("style")).toMatch(/144(?:px)?/)
    expect(leadingIcon.className).toBe("leading")
    expect(leadingIcon.getAttribute("style")).toMatch(/rgb\(1,\s*2,\s*3\)/)
  })
})
