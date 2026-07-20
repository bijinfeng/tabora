import { describe, expect, it, vi } from "vitest"
import * as stylex from "@stylexjs/stylex"
import { render } from "solid-js/web"
import { Button, IconButton } from "../../styled/button/button.styled"

describe("Button", () => {
  it("renders with text and triggers onClick", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onClick = vi.fn()
    render(() => <Button onClick={onClick}>保存</Button>, root)

    const btn = root.querySelector("button")!
    expect(btn.textContent).toBe("保存")
    expect(btn.type).toBe("button")
    btn.click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("does not trigger onClick when disabled", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onClick = vi.fn()
    render(
      () => (
        <Button onClick={onClick} disabled>
          保存
        </Button>
      ),
      root,
    )

    root.querySelector("button")!.click()
    expect(onClick).not.toHaveBeenCalled()
  })

  it("respects type=submit", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Button type="submit">提交</Button>, root)
    expect(root.querySelector("button")!.type).toBe("submit")
  })

  it("uses StyleX classes while preserving variant state attributes", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Button variant="primary" size="sm">
          保存
        </Button>
      ),
      root,
    )

    const btn = root.querySelector("button")!
    expect(btn.className).not.toContain("tbr-btn")
    expect(btn.className.length).toBeGreaterThan(0)
    expect(btn.getAttribute("data-variant")).toBe("primary")
    expect(btn.getAttribute("data-size")).toBe("sm")
  })

  it("composes caller-provided xstyle", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const local = stylex.create({
      grow: {
        flexGrow: 1,
      },
    })

    render(() => <Button xstyle={local.grow}>Save</Button>, root)

    const btn = root.querySelector("button")!
    expect(btn.className).not.toContain("tbr-btn")
    expect(btn.className.length).toBeGreaterThan(0)
  })
})

describe("IconButton", () => {
  it("requires aria-label and renders icon", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <IconButton aria-label="删除">
          <span data-testid="icon">×</span>
        </IconButton>
      ),
      root,
    )
    const btn = root.querySelector("button")!
    expect(btn.getAttribute("aria-label")).toBe("删除")
    expect(btn.querySelector("[data-testid='icon']")).toBeTruthy()
  })
})
