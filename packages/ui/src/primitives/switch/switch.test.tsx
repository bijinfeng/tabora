import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { Switch } from "./switch"

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
})
