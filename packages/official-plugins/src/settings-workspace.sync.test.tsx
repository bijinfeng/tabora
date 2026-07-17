import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import { SyncSettingsPanel } from "./settings-workspace.sync"
import type { SettingsPanelViewProps } from "@tabora/plugin-api"

function mountPanel(hostSync?: SettingsPanelViewProps["host"]["sync"]) {
  const root = document.createElement("div")
  document.body.appendChild(root)
  const props = {
    panelId: "p",
    pluginId: "official.settings.workspace",
    scope: "workspace",
    host: { close: vi.fn(), setDirty: vi.fn(), sync: hostSync },
    workspace: {} as never,
    layouts: [],
    themes: [],
    backgrounds: [],
    searchProviders: [],
    searchSettings: {} as never,
    plugins: [],
  } as unknown as SettingsPanelViewProps
  const dispose = render(() => <SyncSettingsPanel {...props} />, root)
  return { root, dispose }
}

function flush() {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

function syncButton(root: HTMLElement) {
  return Array.from(root.querySelectorAll("button")).find((b) =>
    ["立即同步", "同步中", "未配置"].includes(b.textContent ?? ""),
  )
}

describe("SyncSettingsPanel", () => {
  it("shows local-mode notice and no usable sync button when host.sync is undefined", async () => {
    const { root } = mountPanel(undefined)
    await flush()
    expect(root.textContent).toContain("本地模式")
    expect(root.textContent).toContain("未配置同步服务")
    const btn = syncButton(root)
    expect(btn).toBeTruthy()
    expect(btn!.disabled).toBe(true)
  })

  it("shows the last sync time when host.sync is available", async () => {
    const sync = {
      triggerSync: vi.fn().mockResolvedValue(undefined),
      getLastSyncAt: vi.fn().mockResolvedValue("2026-07-16T08:00:00.000Z"),
    }
    const { root } = mountPanel(sync)
    await flush()
    expect(sync.getLastSyncAt).toHaveBeenCalled()
    expect(root.textContent).toContain("2026-07-16")
    expect(root.textContent).toContain("官方云同步")
  })

  it("triggers sync and updates status on click", async () => {
    const sync = {
      triggerSync: vi.fn().mockResolvedValue(undefined),
      getLastSyncAt: vi
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValue("2026-07-16T09:30:00.000Z"),
    }
    const { root } = mountPanel(sync)
    await flush()
    syncButton(root)!.click()
    await flush()
    expect(sync.triggerSync).toHaveBeenCalledTimes(1)
    expect(root.textContent).toContain("2026-07-16")
    expect(root.textContent).toContain("已同步")
  })

  it("shows a failure message when triggerSync rejects", async () => {
    const sync = {
      triggerSync: vi.fn().mockRejectedValue({ message: "网络错误" }),
      getLastSyncAt: vi.fn().mockResolvedValue(null),
    }
    const { root } = mountPanel(sync)
    await flush()
    syncButton(root)!.click()
    await flush()
    expect(sync.triggerSync).toHaveBeenCalledTimes(1)
    expect(root.textContent).toContain("网络错误")
  })
})
