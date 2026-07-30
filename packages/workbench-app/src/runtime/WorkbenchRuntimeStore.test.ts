import { createRoot } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { createWorkbenchRuntimeStore } from "./WorkbenchRuntimeStore"

describe("createWorkbenchRuntimeStore", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("shows and auto-dismisses plain toasts through the toast manager", () => {
    createRoot((dispose) => {
      const runtime = createWorkbenchRuntimeStore()

      runtime.showToast("已保存")

      expect(runtime.toasts()).toEqual([
        {
          id: "toast-1",
          message: "已保存",
          type: "info",
          duration: 2500,
        },
      ])

      vi.advanceTimersByTime(2500)
      expect(runtime.toasts()).toEqual([])

      dispose()
    })
  })

  it("does not auto-dismiss action toasts", () => {
    createRoot((dispose) => {
      const runtime = createWorkbenchRuntimeStore()

      runtime.showToast("查看详情", {
        type: "error",
        action: { label: "打开", commandId: "open-details" },
      })

      expect(runtime.toasts()).toEqual([
        {
          id: "toast-1",
          message: "查看详情",
          type: "error",
          action: { label: "打开", commandId: "open-details" },
        },
      ])

      vi.runAllTimers()
      expect(runtime.toasts()).toHaveLength(1)

      dispose()
    })
  })
})
