import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { LayoutHostAPI, RegionSlot } from "@tabora/plugin-api"
import { StreamLayout, layoutStream } from "./index"

function makeHost(): LayoutHostAPI {
  return {
    getGlobalActions: () => [{ id: "command", label: "搜索", icon: "⌘", run: vi.fn() }],
    openSettings: vi.fn(),
    openCommandPalette: vi.fn(),
    openAddWidget: vi.fn(),
    toggleTheme: vi.fn(),
    isDark: () => false,
  }
}

function makeSlot(): RegionSlot {
  return {
    regionId: "stream",
    title: "stream",
    accepts: ["widget"],
    instances: [],
    isEmpty: true,
    render: () => <div data-testid="region-stream">stream</div>,
    renderInstance: () => null,
  }
}

describe("StreamLayout", () => {
  it("工具条渲染强制入口，渲染 stream region", () => {
    const host = document.createElement("div")
    document.body.appendChild(host)
    const dispose = render(
      () => <StreamLayout isMobile={false} host={makeHost()} regions={{ stream: makeSlot() }} />,
      host,
    )
    expect(host.querySelector("button.stream-toolbar-btn")).toBeTruthy()
    expect(host.querySelector("[data-testid='region-stream']")).toBeTruthy()
    dispose()
  })
})

describe("layoutStream manifest", () => {
  it("声明 widget region 且只有一个 region", () => {
    const layout = layoutStream.manifest.contributes.layouts![0]!
    expect(layout.regions.length).toBe(1)
    expect(layout.regions[0]!.accepts).toContain("widget")
  })
})
