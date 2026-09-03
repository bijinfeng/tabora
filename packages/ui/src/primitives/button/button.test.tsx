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

  it("renders a navigable anchor when href is provided", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Button href="/download">下载</Button>, root)

    const link = root.querySelector("a")!
    expect(link.getAttribute("href")).toBe("/download")
    expect(link.textContent).toBe("下载")
    expect(link.getAttribute("data-variant")).toBe("secondary")
  })

  it("forwards data attributes to the rendered control", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Button data-testid="save-control">保存</Button>, root)

    expect(root.querySelector("button")?.getAttribute("data-testid")).toBe("save-control")
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
    expect(btn.hasAttribute("data-tbr-button")).toBe(false)
  })

  it("supports compact mini actions", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Button size="mini" aria-label="删除">
          删除
        </Button>
      ),
      root,
    )

    const btn = root.querySelector("button")!
    expect(btn.getAttribute("data-size")).toBe("mini")
    expect(btn.className.length).toBeGreaterThan(0)
  })

  it("supports link actions without changing button semantics", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onClick = vi.fn()
    render(
      () => (
        <Button variant="link" size="sm" onClick={onClick}>
          忘记密码？
        </Button>
      ),
      root,
    )

    const button = root.querySelector("button")!
    expect(button.getAttribute("data-variant")).toBe("link")
    expect(button.textContent).toBe("忘记密码？")
    button.click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it("composes caller-provided xstyle", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const local = stylex.create({
      grow: {
        flexGrow: 1,
      },
      width: (value: number) => ({
        width: value,
      }),
    })

    render(() => <Button xstyle={[local.grow, local.width(144)]}>Save</Button>, root)

    const btn = root.querySelector("button")!
    expect(btn.className).not.toContain("tbr-btn")
    expect(btn.className.length).toBeGreaterThan(0)
    expect(btn.getAttribute("style")).toMatch(/144(?:px)?/)
  })

  it("renders icon at start position by default", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Button
          icon={({ size, strokeWidth }) => (
            <span data-testid="icon" data-size={size} data-stroke-width={strokeWidth}>
              +
            </span>
          )}
        >
          <span data-testid="text">添加</span>
        </Button>
      ),
      root,
    )

    const btn = root.querySelector("button")!
    const firstChild = btn.firstElementChild as HTMLElement
    const lastChild = btn.lastElementChild as HTMLElement
    expect(firstChild.getAttribute("data-testid")).toBe("icon")
    expect(lastChild.getAttribute("data-testid")).toBe("text")
    expect(btn.getAttribute("data-icon-placement")).toBe("start")
    expect(firstChild.getAttribute("data-size")).toBe("16")
    expect(firstChild.getAttribute("data-stroke-width")).toBe("2")
  })

  it("keeps accepting JSX icons for backwards compatibility", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Button size="sm" icon={<span data-testid="icon">+</span>}>
          添加
        </Button>
      ),
      root,
    )

    expect(root.querySelector("[data-testid='icon']")).toBeTruthy()
    root.remove()
  })

  it("renders icon at end position when specified", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Button
          icon={({ size }) => (
            <span data-testid="icon" data-size={size}>
              +
            </span>
          )}
          iconPlacement="end"
        >
          <span data-testid="text">下载</span>
        </Button>
      ),
      root,
    )

    const btn = root.querySelector("button")!
    const firstChild = btn.firstElementChild as HTMLElement
    const lastChild = btn.lastElementChild as HTMLElement
    expect(firstChild.getAttribute("data-testid")).toBe("text")
    expect(lastChild.getAttribute("data-testid")).toBe("icon")
    expect(btn.getAttribute("data-icon-placement")).toBe("end")
    expect(lastChild.getAttribute("data-size")).toBe("16")
  })

  it("supports shape=round with data attribute", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(() => <Button shape="round">圆角</Button>, root)

    const btn = root.querySelector("button")!
    expect(btn.getAttribute("data-shape")).toBe("round")
  })

  it("supports shape=circle with data attribute", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Button shape="circle" aria-label="add">
          <span>+</span>
        </Button>
      ),
      root,
    )

    const btn = root.querySelector("button")!
    expect(btn.getAttribute("data-shape")).toBe("circle")
  })

  it("renders href link with icon at start position", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <Button
          href="/download"
          size="sm"
          icon={({ size }) => (
            <span data-testid="icon" data-size={size}>
              ↓
            </span>
          )}
        >
          <span data-testid="text">下载</span>
        </Button>
      ),
      root,
    )

    const link = root.querySelector("a")!
    expect(link).not.toBeNull()
    const firstChild = link.firstElementChild as HTMLElement
    const lastChild = link.lastElementChild as HTMLElement
    expect(firstChild.getAttribute("data-testid")).toBe("icon")
    expect(lastChild.getAttribute("data-testid")).toBe("text")
    expect(firstChild.getAttribute("data-size")).toBe("12")
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

  it("supports all variants including primary, subtle and danger-subtle", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <>
          <IconButton aria-label="btn-primary" variant="primary">
            <span>primary</span>
          </IconButton>
          <IconButton aria-label="btn-secondary" variant="secondary">
            <span>secondary</span>
          </IconButton>
          <IconButton aria-label="btn-subtle" variant="subtle">
            <span>subtle</span>
          </IconButton>
          <IconButton aria-label="btn-ghost" variant="ghost">
            <span>ghost</span>
          </IconButton>
          <IconButton aria-label="btn-link" variant="link">
            <span>link</span>
          </IconButton>
          <IconButton aria-label="btn-danger" variant="danger">
            <span>danger</span>
          </IconButton>
          <IconButton aria-label="btn-danger-subtle" variant="danger-subtle">
            <span>danger-subtle</span>
          </IconButton>
        </>
      ),
      root,
    )
    const variants = ["primary", "secondary", "subtle", "ghost", "link", "danger", "danger-subtle"]
    variants.forEach((v) => {
      const btn = root.querySelector(`button[data-variant="${v}"]`)
      expect(btn).not.toBeNull()
    })
  })

  it("supports shape attribute", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <>
          <IconButton aria-label="default" shape="default">
            <span>A</span>
          </IconButton>
          <IconButton aria-label="round" shape="round">
            <span>B</span>
          </IconButton>
          <IconButton aria-label="circle" shape="circle">
            <span>C</span>
          </IconButton>
        </>
      ),
      root,
    )

    expect(root.querySelector('button[data-shape="default"]')).not.toBeNull()
    expect(root.querySelector('button[data-shape="round"]')).not.toBeNull()
    expect(root.querySelector('button[data-shape="circle"]')).not.toBeNull()
  })
})
