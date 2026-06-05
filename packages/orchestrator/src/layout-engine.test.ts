import { describe, expect, it, vi } from "vitest"
import type { BuiltinPlugin } from "@tabora/platform-kernel"
import type { PluginInstance } from "@tabora/plugin-api"
import { createLayoutEngine, type InstanceRenderer } from "./layout-engine"

const layoutPlugin: BuiltinPlugin = {
  enabled: true,
  manifest: {
    id: "test.layout",
    name: "Test Layout",
    version: "1.0.0",
    apiVersion: "1.0.0",
    entry: "./test",
    engine: { platform: "^0.1.0" },
    contributes: {
      layouts: [
        {
          id: "test.layout",
          title: "Test",
          view: "test.layout.view",
          regions: [
            { id: "grid", title: "网格", accepts: ["widget"], required: true },
            { id: "top", title: "顶部", accepts: ["search"], required: false },
          ],
          defaultRegions: { grid: [], top: [] },
          supportsResponsive: true,
        },
      ],
    },
  },
  activate() {},
}

function instance(
  id: string,
  regionId: string,
  ep: PluginInstance["extensionPoint"],
): PluginInstance {
  return {
    id,
    workspaceId: "ws",
    pluginId: "p",
    contributionId: "c",
    extensionPoint: ep,
    regionId,
    enabled: true,
    config: {},
    grid: { x: 0, y: 0, colSpan: 1, rowSpan: 1 },
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }
}

function makeRenderer(calls: string[]): InstanceRenderer {
  return {
    renderWidget: (inst) => {
      calls.push(`widget:${inst.id}`)
      return null
    },
    renderSearch: (inst) => {
      calls.push(`search:${inst.id}`)
      return null
    },
  }
}

function makeEngine(instances: PluginInstance[], calls: string[]) {
  return createLayoutEngine({
    catalog: {
      findLayoutContribution: (id: string) =>
        layoutPlugin.manifest.contributes.layouts!.find((l) => l.id === id),
    } as never,
    instanceRenderer: makeRenderer(calls),
    hostActions: {
      getGlobalActions: () => [
        { id: "settings", label: "设置", icon: "settings", run: vi.fn() },
        { id: "command", label: "搜索", icon: "search", run: vi.fn() },
      ],
      openSettings: vi.fn(),
      openCommandPalette: vi.fn(),
      openAddWidget: vi.fn(),
      toggleTheme: vi.fn(),
      isDark: () => false,
    },
  })
}

describe("createLayoutEngine.buildRegionSlots", () => {
  it("按 region 映射实例，isEmpty 准确，跨 region 不串", () => {
    const calls: string[] = []
    const insts = [instance("w1", "grid", "widget"), instance("s1", "top", "search")]
    const slots = makeEngine(insts, calls).buildRegionSlots("test.layout", insts)
    expect(slots["grid"]!.instances.map((i) => i.id)).toEqual(["w1"])
    expect(slots["top"]!.instances.map((i) => i.id)).toEqual(["s1"])
    expect(slots["grid"]!.isEmpty).toBe(false)
    expect(slots["grid"]!.accepts).toEqual(["widget"])
  })

  it("render() 对每个实例调一次对应 renderer", () => {
    const calls: string[] = []
    const insts = [instance("w1", "grid", "widget"), instance("w2", "grid", "widget")]
    const slots = makeEngine(insts, calls).buildRegionSlots("test.layout", insts)
    slots["grid"]!.render()
    expect(calls).toEqual(["widget:w1", "widget:w2"])
  })

  it("renderInstance 只渲染单个实例", () => {
    const calls: string[] = []
    const insts = [instance("w1", "grid", "widget"), instance("w2", "grid", "widget")]
    const slots = makeEngine(insts, calls).buildRegionSlots("test.layout", insts)
    slots["grid"]!.renderInstance(insts[1]!)
    expect(calls).toEqual(["widget:w2"])
  })

  it("空 region isEmpty 为 true", () => {
    const calls: string[] = []
    const slots = makeEngine([], calls).buildRegionSlots("test.layout", [])
    expect(slots["grid"]!.isEmpty).toBe(true)
  })

  it("不把 extensionPoint 不被接受的实例放进 region", () => {
    const calls: string[] = []
    const insts = [
      instance("w1", "grid", "widget"),
      instance("bad-search", "grid", "search"),
      instance("bad-widget", "top", "widget"),
    ]
    const slots = makeEngine(insts, calls).buildRegionSlots("test.layout", insts)
    expect(slots["grid"]!.instances.map((i) => i.id)).toEqual(["w1"])
    expect(slots["top"]!.instances).toEqual([])
  })
})

describe("createLayoutEngine.buildHostAPI", () => {
  it("getGlobalActions 返回含稳定 host action id 的完整集，与布局无关", () => {
    const calls: string[] = []
    const host = makeEngine([], calls).buildHostAPI()
    const ids = host.getGlobalActions("rail").map((a) => a.id)
    expect(ids).toContain("settings")
    expect(ids).toContain("command")
  })
})
