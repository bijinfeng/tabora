import { createRoot } from "solid-js"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { PluginRecord } from "@tabora/plugin-api"
import type { ToastManager } from "@tabora/orchestrator"

import { createWorkbenchRuntimeStore } from "./WorkbenchRuntimeStore"

describe("createWorkbenchRuntimeStore", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("exposes runtime defaults and setters", () => {
    createRoot((dispose) => {
      const runtime = createWorkbenchRuntimeStore()

      expect(runtime.kernelReady()).toBe(false)
      expect(runtime.pluginRecords()).toEqual([])
      expect(runtime.toasts()).toEqual([])

      runtime.setKernelReady(true)
      expect(runtime.kernelReady()).toBe(true)

      const records: PluginRecord[] = [
        { pluginId: "official.notes", enabled: true } as unknown as PluginRecord,
      ]
      runtime.setPluginRecords(records)
      expect(runtime.pluginRecords()).toEqual(records)

      dispose()
    })
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

  it("can use an injected toast manager implementation", () => {
    createRoot((dispose) => {
      const show = vi.fn<ToastManager["show"]>(() => "toast-custom")
      const dismiss = vi.fn<ToastManager["dismiss"]>(() => {})
      const list = vi.fn<ToastManager["list"]>(() => [
        { id: "toast-custom", message: "Custom", type: "success" },
      ])
      const shouldAutoDismiss = vi.fn<ToastManager["shouldAutoDismiss"]>(() => false)
      const manager: ToastManager = {
        show,
        dismiss,
        list,
        shouldAutoDismiss,
      }
      const runtime = createWorkbenchRuntimeStore({ createToastManager: () => manager })

      runtime.showToast("Custom", { type: "success" })

      expect(show).toHaveBeenCalledWith("Custom", { type: "success" })
      expect(runtime.toasts()).toEqual([{ id: "toast-custom", message: "Custom", type: "success" }])

      dispose()
    })
  })
})
