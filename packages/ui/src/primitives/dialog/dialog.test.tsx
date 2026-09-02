import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"

import { Dialog } from "./dialog"

describe("Dialog", () => {
  it("owns the header, body, and footer structure", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const dispose = render(
      () => (
        <Dialog
          open
          onCancel={() => {}}
          title="确认移除"
          description="该操作不可撤销。"
          footer={<button>确认</button>}
        >
          <input aria-label="移除原因" />
        </Dialog>
      ),
      root,
    )

    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!
    expect(dialog.querySelector("header")?.textContent).toContain("确认移除")
    const title = dialog.querySelector<HTMLElement>("header h2")
    expect(title?.textContent).toBe("确认移除")
    expect(title?.style.fontSize).toBe("inherit")
    expect(dialog.querySelector("div > p")?.textContent).toBe("该操作不可撤销。")
    expect(dialog.querySelector('[aria-label="移除原因"]')).not.toBeNull()
    expect(dialog.querySelector("footer button")?.textContent).toBe("确认")

    dispose()
    root.remove()
  })

  it("does not dismiss when focus moves outside", () => {
    const root = document.createElement("div")
    const outside = document.createElement("button")
    document.body.append(root, outside)
    const onCancel = vi.fn()
    const dispose = render(
      () => (
        <Dialog open onCancel={onCancel} title="设置">
          <input />
        </Dialog>
      ),
      root,
    )

    outside.focus()

    expect(onCancel).not.toHaveBeenCalled()
    dispose()
    root.remove()
    outside.remove()
  })
})
