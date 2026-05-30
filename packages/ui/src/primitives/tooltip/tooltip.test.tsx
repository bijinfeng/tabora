import { describe, expect, it } from "vitest"
import { render } from "solid-js/web"
import { Tooltip } from "./tooltip"

describe("Tooltip", () => {
  it("renders trigger child", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Tooltip content="删除">
          <button>x</button>
        </Tooltip>
      ),
      root,
    )
    expect(root.querySelector("button")!.textContent).toBe("x")
  })
})
