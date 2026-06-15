import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"

import { Combobox, type ComboboxOption } from "./combobox"

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

    const option = document.body.querySelector(".tbr-combo-option") as HTMLElement
    expect(option).toBeTruthy()

    root.remove()
  })
})
