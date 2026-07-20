import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { RadioGroup } from "./radioGroup"
import { RadioGroup as StyledRadioGroup } from "../../styled/radioGroup/radioGroup.styled"

const options = [
  { value: "light", label: "明亮", description: "浅色界面" },
  { value: "dark", label: "暗色" },
] as const

describe("RadioGroup", () => {
  it("reports the selected value", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onChange = vi.fn()
    render(
      () => (
        <RadioGroup
          name="theme"
          value="light"
          options={[...options]}
          onChange={onChange}
          aria-label="主题"
        />
      ),
      root,
    )

    const dark = root.querySelector("input[value='dark']") as HTMLInputElement
    dark.click()
    expect(onChange).toHaveBeenCalledWith("dark")
  })

  it("uses StyleX classes while preserving checked and direction state", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <StyledRadioGroup
          name="theme"
          value="dark"
          direction="horizontal"
          options={[...options]}
          onChange={() => {}}
          aria-label="主题"
        />
      ),
      root,
    )

    const group = root.firstElementChild as HTMLElement
    const checkedInput = root.querySelector("input[value='dark']") as HTMLInputElement
    const checked = checkedInput.closest("[data-checked]") as HTMLElement
    expect(group.className).not.toContain("tbr-radio")
    expect(group.className.length).toBeGreaterThan(0)
    expect(group.getAttribute("data-direction")).toBe("horizontal")
    expect(checked.className).not.toContain("tbr-radio-item")
    expect(checked.className.length).toBeGreaterThan(0)
    expect(root.querySelector("[class*='tbr-radio']")).toBeNull()
  })
})
