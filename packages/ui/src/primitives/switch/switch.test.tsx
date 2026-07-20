import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { Switch } from "./switch"
import { Switch as StyledSwitch } from "../../styled/switch/switch.styled"

describe("Switch", () => {
  it("toggles via click and reports new value", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onChange = vi.fn()
    render(() => <Switch checked={false} onChange={onChange} aria-label="启用" />, root)
    const input = root.querySelector("input[type='checkbox']") as HTMLInputElement
    input.click()
    expect(onChange).toHaveBeenCalledWith(true)
  })

  it("uses StyleX classes while preserving checked and loading state", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => <StyledSwitch checked onChange={() => {}} loading size="sm" aria-label="启用" />,
      root,
    )

    const switchRoot = root.querySelector("[data-checked]") as HTMLElement
    expect(switchRoot.className).not.toContain("tbr-switch")
    expect(switchRoot.className.length).toBeGreaterThan(0)
    expect(switchRoot.getAttribute("data-size")).toBe("sm")
    expect(switchRoot.hasAttribute("data-loading")).toBe(true)
    expect(root.querySelector("[class*='tbr-switch']")).toBeNull()
  })
})
