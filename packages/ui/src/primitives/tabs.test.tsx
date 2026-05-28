import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { Tabs } from "./tabs"

describe("Tabs", () => {
  it("invokes onChange when switching tab via click", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onChange = vi.fn()
    render(
      () => (
        <Tabs
          value="a"
          onChange={onChange}
          aria-label="设置面板"
          tabs={[
            { value: "a", label: "插件", content: <p>a</p> },
            { value: "b", label: "外观", content: <p>b</p> },
          ]}
        />
      ),
      root,
    )
    const triggers = root.querySelectorAll("[role='tab']")
    ;(triggers[1] as HTMLElement).click()
    expect(onChange).toHaveBeenCalledWith("b")
  })
})
