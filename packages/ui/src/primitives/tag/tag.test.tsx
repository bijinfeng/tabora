import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { CheckableTag, Tag } from "./tag"
import { CheckableTag as StyledCheckableTag, Tag as StyledTag } from "../../styled/tag/tag.styled"

describe("Tag", () => {
  it("supports Ant Design-style close actions without triggering the parent", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onClose = vi.fn()
    const onParentClick = vi.fn()
    render(
      () => (
        <div onClick={onParentClick}>
          <Tag closable onClose={onClose}>
            设计
          </Tag>
        </div>
      ),
      root,
    )

    root.querySelector<HTMLButtonElement>("button")?.click()

    expect(onClose).toHaveBeenCalledOnce()
    expect(onParentClick).not.toHaveBeenCalled()
    root.remove()
  })

  it("reports the next checked state for a checkable tag", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onChange = vi.fn()
    render(
      () => (
        <CheckableTag checked={false} onChange={onChange}>
          工作
        </CheckableTag>
      ),
      root,
    )

    root.querySelector<HTMLButtonElement>("button")?.click()

    expect(onChange).toHaveBeenCalledWith(true)
    root.remove()
  })

  it("uses a button when a tag is directly actionable", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onClick = vi.fn()
    render(() => <Tag onClick={onClick}>添加标签</Tag>, root)

    root.querySelector<HTMLButtonElement>("button")?.click()

    expect(onClick).toHaveBeenCalledOnce()
    root.remove()
  })

  it("uses compact StyleX styles for closable and checkable tags", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    render(
      () => (
        <>
          <StyledTag closable>设计</StyledTag>
          <StyledCheckableTag checked>工作</StyledCheckableTag>
        </>
      ),
      root,
    )

    expect(root.querySelector("span")?.className.length).toBeGreaterThan(0)
    expect(
      root.querySelector<HTMLButtonElement>("button[aria-label='移除标签']")?.className.length,
    ).toBeGreaterThan(0)
    expect(
      root.querySelector<HTMLButtonElement>("button[aria-pressed='true']")?.className.length,
    ).toBeGreaterThan(0)
    root.remove()
  })
})
