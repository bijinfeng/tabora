import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"

import { Combobox } from "./combobox"

describe("Combobox", () => {
  it("exposes combobox semantics and returns the selected option", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onInput = vi.fn()
    const onSelect = vi.fn()

    render(
      () => (
        <Combobox
          value="Wea"
          onInput={onInput}
          onSelect={onSelect}
          placeholder="搜索插件..."
          aria-label="插件搜索"
          options={[
            { value: "notes", label: "Notes" },
            { value: "weather", label: "Weather" },
          ]}
        />
      ),
      root,
    )

    const input = root.querySelector("input")!
    expect(input.getAttribute("role")).toBe("combobox")
    expect(input.getAttribute("aria-label")).toBe("插件搜索")
    input.dispatchEvent(new FocusEvent("focusin", { bubbles: true }))

    const option = root.querySelector(".tbr-combo-option") as HTMLDivElement
    option.click()

    expect(onSelect).toHaveBeenCalledWith({ value: "weather", label: "Weather" })

    root.remove()
  })
})
