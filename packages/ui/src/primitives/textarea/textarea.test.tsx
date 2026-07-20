import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { Textarea } from "../../styled/textarea/textarea.styled"

describe("Textarea", () => {
  it("renders controlled value and triggers onInput", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onInput = vi.fn()
    render(
      () => <Textarea value="hi" onInput={onInput} placeholder="写点什么" aria-label="便签" />,
      root,
    )
    const ta = root.querySelector("textarea")!
    expect(ta.value).toBe("hi")
    expect(ta.placeholder).toBe("写点什么")
    expect(ta.getAttribute("aria-label")).toBe("便签")
    ta.value = "ok"
    ta.dispatchEvent(new Event("input", { bubbles: true }))
    expect(onInput).toHaveBeenCalledWith("ok")
  })

  it("uses StyleX classes while preserving invalid and size state", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => <Textarea value="hi" onInput={() => {}} invalid size="sm" aria-label="便签" />,
      root,
    )

    const ta = root.querySelector("textarea")!
    expect(ta.className).not.toContain("tbr-textarea")
    expect(ta.className.length).toBeGreaterThan(0)
    expect(ta.getAttribute("data-size")).toBe("sm")
    expect(ta.hasAttribute("data-invalid")).toBe(true)
  })
})
