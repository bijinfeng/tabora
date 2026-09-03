import { render } from "solid-js/web"
import { describe, expect, it } from "vitest"

import { DropdownMenu } from "./dropdownMenu.styled"

describe("DropdownMenu", () => {
  it("applies a caller-defined minimum width without fixing the menu width", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const dispose = render(
      () => (
        <DropdownMenu
          defaultOpen
          minWidth={144}
          items={[{ id: "edit", label: "编辑" }]}
          triggerAriaLabel="打开菜单"
        >
          操作
        </DropdownMenu>
      ),
      root,
    )

    const menu = document.querySelector<HTMLElement>("[role='menu']")
    expect(menu?.style.minWidth).toBe("144px")
    expect(menu?.style.width).toBe("")

    dispose()
    root.remove()
  })

  it("renders grouped entries with their group labels", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const dispose = render(
      () => (
        <DropdownMenu
          defaultOpen
          items={[
            { id: "builtin", label: "内置模型", items: [{ id: "gpt", label: "GPT" }] },
            { id: "custom", label: "自定义供应商", items: [{ id: "local", label: "Local" }] },
          ]}
          triggerAriaLabel="打开菜单"
        >
          操作
        </DropdownMenu>
      ),
      root,
    )

    expect(document.body.textContent).toContain("内置模型")
    expect(document.body.textContent).toContain("自定义供应商")
    expect(document.body.textContent).toContain("Local")

    dispose()
    root.remove()
  })
})
