import * as stylex from "@stylexjs/stylex"
import { render } from "solid-js/web"
import { describe, expect, it, vi } from "vitest"

import { Drawer } from "./drawer.styled"

const styles = stylex.create({
  root: {
    pointerEvents: "auto",
  },
})

describe("Drawer", () => {
  it("composes accessible Kobalte slots with side, size, footer, and caller styles", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onClose = vi.fn()
    const dispose = render(
      () => (
        <Drawer
          open
          onClose={onClose}
          title="插件详情"
          description="权限与运行状态"
          footer={<button type="button">保存</button>}
          side="left"
          size="lg"
          xstyle={styles.root}
        >
          正文
        </Drawer>
      ),
      root,
    )

    const dialog = document.body.querySelector<HTMLElement>("[role='dialog']")
    expect(dialog?.getAttribute("data-side")).toBe("left")
    expect(dialog?.getAttribute("data-size")).toBe("lg")
    expect(document.body.textContent).toContain("权限与运行状态")
    expect(document.body.textContent).toContain("保存")
    expect(document.body.querySelector("[data-drawer-root]")?.className.length).toBeGreaterThan(0)

    document.body.querySelector<HTMLButtonElement>("button[aria-label='关闭']")?.click()
    expect(onClose).toHaveBeenCalledTimes(1)

    dispose()
    root.remove()
  })
})
