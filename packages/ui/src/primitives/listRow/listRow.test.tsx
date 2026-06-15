import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { ListRow } from "./listRow"

describe("ListRow", () => {
  it("renders as button when onClick provided and triggers it", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onClick = vi.fn()
    render(() => <ListRow primary="主标" secondary="副标" onClick={onClick} />, root)
    const btn = root.querySelector("button")!
    expect(btn).toBeTruthy()
    expect(btn.textContent).toContain("主标")
    btn.click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("renders as div when no onClick", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <ListRow primary="x" />, root)
    expect(root.querySelector("button")).toBeNull()
    expect(root.querySelector("div")!.tagName).toBe("DIV")
  })

  it("exposes selected and danger state via data attributes", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)

    render(() => <ListRow primary="删除实例" selected danger onClick={() => {}} />, root)

    const button = root.querySelector("button")
    expect(button?.dataset.selected).toBe("")
    expect(button?.dataset.danger).toBe("")
    expect(button?.getAttribute("aria-pressed")).toBe("true")
  })
})
