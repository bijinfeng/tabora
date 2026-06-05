import { describe, expect, it } from "vitest"

import { createToastManager } from "./toast-manager"

describe("createToastManager", () => {
  it("keeps the newest three toasts and preserves explicit options", () => {
    const manager = createToastManager()

    manager.show("One")
    manager.show("Two", { type: "success" })
    manager.show("Three", { type: "warning", duration: 5000 })
    const actionId = manager.show("Four", {
      type: "error",
      action: { label: "查看", commandId: "open-details" },
    })

    expect(manager.list()).toEqual([
      { id: "toast-2", message: "Two", type: "success", duration: 2500 },
      { id: "toast-3", message: "Three", type: "warning", duration: 5000 },
      {
        id: actionId,
        message: "Four",
        type: "error",
        action: { label: "查看", commandId: "open-details" },
      },
    ])
  })

  it("does not auto-dismiss action toasts but dismisses normal toasts", () => {
    const manager = createToastManager()
    const normalId = manager.show("Normal")
    const actionId = manager.show("Action", {
      action: { label: "打开", commandId: "open" },
    })

    expect(manager.shouldAutoDismiss(normalId)).toBe(true)
    expect(manager.shouldAutoDismiss(actionId)).toBe(false)

    manager.dismiss(normalId)

    expect(manager.list().map((toast) => toast.id)).toEqual([actionId])
  })
})
