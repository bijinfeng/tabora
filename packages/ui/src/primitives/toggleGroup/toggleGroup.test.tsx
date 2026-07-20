import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { ToggleGroup } from "./toggleGroup"
import { ToggleGroup as StyledToggleGroup } from "../../styled/toggleGroup/toggleGroup.styled"

const options = [
  { value: "bold", label: "B" },
  { value: "italic", label: "I" },
]

describe("ToggleGroup", () => {
  it("reports selected values when an item is toggled", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onChange = vi.fn()
    render(
      () => (
        <ToggleGroup value={["bold"]} onChange={onChange} options={options} aria-label="格式" />
      ),
      root,
    )

    const italic = [...root.querySelectorAll("button")].find(
      (button) => button.textContent === "I",
    )!
    italic.click()
    expect(onChange).toHaveBeenCalledWith(["bold", "italic"])
  })

  it("uses StyleX classes while preserving selected state", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <StyledToggleGroup
          value={["bold"]}
          onChange={() => {}}
          options={options}
          aria-label="格式"
        />
      ),
      root,
    )

    const group = root.firstElementChild as HTMLElement
    const selected = [...root.querySelectorAll("button")].find((button) =>
      button.hasAttribute("data-pressed"),
    )!
    expect(group.className).not.toContain("tbr-toggle-group")
    expect(group.className.length).toBeGreaterThan(0)
    expect(selected.className).not.toContain("tbr-toggle-group-item")
    expect(selected.className.length).toBeGreaterThan(0)
  })
})
