import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { JSX } from "solid-js"
import type { LayoutHostAPI, PluginInstance, RegionSlot } from "@tabora/plugin-api"
import { MasonryLayout, layoutDiyMasonry } from "./index"

function inst(id: string): PluginInstance {
  return {
    id,
    workspaceId: "ws",
    pluginId: "p",
    contributionId: "c",
    extensionPoint: "widget",
    regionId: "masonry",
    enabled: true,
    config: {},
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }
}

function makeHost(settingsRun: () => void): LayoutHostAPI {
  return {
    getGlobalActions: (surface) =>
      surface === "menu"
        ? [
            { id: "settings", label: "设置", icon: "⚙", run: settingsRun },
            { id: "command", label: "搜索", icon: "⌘", run: vi.fn() },
          ]
        : [],
    openSettings: vi.fn(),
    openCommandPalette: vi.fn(),
    openAddWidget: vi.fn(),
    toggleTheme: vi.fn(),
    isDark: () => false,
  }
}

function makeSlot(instances: PluginInstance[], rendered: string[]): RegionSlot<JSX.Element> {
  return {
    regionId: "masonry",
    title: "瀑布流",
    accepts: ["widget"],
    instances,
    isEmpty: instances.length === 0,
    render: () => null,
    renderInstance: (i) => {
      rendered.push(i.id)
      return <div data-testid={`card-${i.id}`}>{i.id}</div>
    },
  }
}

describe("DIY masonry 第三方验证", () => {
  it("用 renderInstance 把卡片分列渲染", () => {
    const rendered: string[] = []
    const host = document.createElement("div")
    document.body.appendChild(host)
    const dispose = render(
      () => (
        <MasonryLayout
          isMobile={false}
          host={makeHost(vi.fn())}
          regions={{ masonry: makeSlot([inst("a"), inst("b"), inst("c"), inst("d")], rendered) }}
        />
      ),
      host,
    )
    // For 按列遍历：col0(a,d), col1(b), col2(c) → 渲染顺序 a,d,b,c
    // 用 sort() 验证"所有卡片都被 renderInstance 渲染"，不耦合分列算法顺序
    expect([...rendered].sort()).toEqual(["a", "b", "c", "d"])
    expect(host.querySelectorAll(".masonry-column").length).toBe(3)
    dispose()
  })

  it("浮动菜单含设置入口且可达（点击触发 run）", () => {
    const settingsRun = vi.fn()
    const host = document.createElement("div")
    document.body.appendChild(host)
    const dispose = render(
      () => (
        <MasonryLayout
          isMobile={false}
          host={makeHost(settingsRun)}
          regions={{ masonry: makeSlot([], []) }}
        />
      ),
      host,
    )
    ;(host.querySelector(".masonry-fab") as HTMLButtonElement).click()
    const items = [...host.querySelectorAll(".masonry-menu-item")] as HTMLButtonElement[]
    const settings = items.find((b) => b.textContent?.includes("设置"))
    expect(settings).toBeTruthy()
    settings!.click()
    expect(settingsRun).toHaveBeenCalled()
    dispose()
  })
})

describe("layoutDiyMasonry manifest", () => {
  it("只声明一个 widget region（验证最小强制）", () => {
    const layout = layoutDiyMasonry.manifest.contributes.layouts![0]!
    expect(layout.regions.length).toBe(1)
    expect(layout.regions[0]!.accepts).toEqual(["widget"])
    expect(layout.view).toBeTruthy()
  })
})
