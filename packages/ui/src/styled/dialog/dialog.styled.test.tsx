import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"

import { Dialog } from "./dialog.styled"

describe("Dialog", () => {
  it("provides Ant Design-style default cancel and confirm actions", () => {
    const root = document.createElement("div")
    document.body.appendChild(root)
    const onCancel = vi.fn()
    const onOk = vi.fn()
    const dispose = render(
      () => (
        <Dialog
          open
          onCancel={onCancel}
          onOk={onOk}
          title="确认移除"
          cancelText="返回"
          okText="移除"
          destructive
        />
      ),
      root,
    )

    const dialog = document.querySelector<HTMLElement>('[role="dialog"]')!
    const [cancel, ok] = Array.from(dialog.querySelectorAll<HTMLButtonElement>("footer button"))
    expect(cancel?.textContent).toBe("返回")
    expect(ok?.textContent).toBe("移除")
    expect(cancel?.dataset.size).toBe("sm")
    expect(ok?.dataset.size).toBe("sm")
    expect(ok?.dataset.variant).toBe("danger")
    cancel?.click()
    ok?.click()
    expect(onCancel).toHaveBeenCalledOnce()
    expect(onOk).toHaveBeenCalledOnce()

    dispose()
    root.remove()
  })
})
