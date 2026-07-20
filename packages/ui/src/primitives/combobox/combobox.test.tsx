import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"

import { Combobox, type ComboboxOption } from "./combobox"
import { Combobox as StyledCombobox } from "../../styled/combobox/combobox.styled"

describe("Combobox", () => {
  it("renders input and opens dropdown on focus", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    const onInput = vi.fn()
    const onSelect = vi.fn()

    const options: ComboboxOption<string>[] = [
      { value: "weather", label: "天气" },
      { value: "wallet", label: "钱包" },
    ]

    render(
      () => (
        <Combobox
          value=""
          options={options}
          onInput={onInput}
          onSelect={onSelect}
          placeholder="搜索..."
          aria-label="搜索框"
          id="test-combo"
        />
      ),
      root,
    )

    const input = root.querySelector("#test-combo") as HTMLInputElement
    expect(input).toBeTruthy()
    input.focus()

    const option = [...document.body.querySelectorAll("[role='option']")].at(-1) as HTMLElement
    expect(option).toBeTruthy()

    root.remove()
  })

  it("uses StyleX classes while preserving input and option semantics", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    const options: ComboboxOption<string>[] = [
      { value: "weather", label: "天气" },
      { value: "wallet", label: "钱包" },
    ]

    render(
      () => (
        <StyledCombobox
          value=""
          options={options}
          onInput={() => {}}
          onSelect={() => {}}
          placeholder="搜索..."
          aria-label="搜索框"
          id="styled-combo"
        />
      ),
      root,
    )

    const input = root.querySelector("#styled-combo") as HTMLInputElement
    input.focus()

    const wrapper = root.firstElementChild as HTMLElement
    const option = [...document.body.querySelectorAll("[role='option']")].at(-1) as HTMLElement
    expect(wrapper.className).not.toContain("tbr-combo")
    expect(wrapper.className.length).toBeGreaterThan(0)
    expect(input.className).not.toContain("tbr-combo-input")
    expect(input.className.length).toBeGreaterThan(0)
    expect(option.className).not.toContain("tbr-combo-option")
    expect(option.className.length).toBeGreaterThan(0)
    expect(root.querySelector("[class*='tbr-combo']")).toBeNull()

    root.remove()
  })
})
