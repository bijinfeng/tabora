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
})
