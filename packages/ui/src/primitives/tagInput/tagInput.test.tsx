import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { TagInput } from "./tagInput"
import { TagInput as StyledTagInput } from "../../styled/tagInput/tagInput.styled"

describe("TagInput", () => {
  it("adds a tag when Enter is pressed", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onChange = vi.fn()
    render(
      () => (
        <TagInput value={["设计"]} onChange={onChange} aria-label="标签" placeholder="输入标签" />
      ),
      root,
    )

    const input = root.querySelector("input")!
    input.value = "同步"
    input.dispatchEvent(new Event("input", { bubbles: true }))
    input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    expect(onChange).toHaveBeenCalledWith(["设计", "同步"])
  })

  it("uses StyleX classes while preserving disabled state", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => <StyledTagInput value={["设计"]} onChange={() => {}} disabled aria-label="标签" />,
      root,
    )

    const tagInput = root.firstElementChild as HTMLElement
    const remove = root.querySelector("button[aria-label='移除 设计']") as HTMLButtonElement
    expect(tagInput.className).not.toContain("tbr-tag-input")
    expect(tagInput.className.length).toBeGreaterThan(0)
    expect(tagInput.hasAttribute("data-disabled")).toBe(true)
    expect(remove.className).not.toContain("tbr-tag-input-remove")
    expect(remove.className.length).toBeGreaterThan(0)
    expect(remove.disabled).toBe(true)
    expect(root.querySelector("[class*='tbr-tag-input']")).toBeNull()
  })
})
