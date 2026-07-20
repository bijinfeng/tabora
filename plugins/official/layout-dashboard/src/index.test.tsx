import { describe, expect, it, vi } from "vitest"
import { render } from "solid-js/web"
import type { JSX } from "solid-js"
import type { LayoutHostAPI, PluginInstance, RegionSlot } from "@tabora/plugin-api"
import { DashboardLayout, FocusLayout, layoutDashboard } from "./index"

function instance(overrides: Partial<PluginInstance>): PluginInstance {
  return {
    id: "widget-1",
    workspaceId: "workspace-1",
    pluginId: "official.widgets.weather",
    contributionId: "weather",
    extensionPoint: "widget",
    regionId: "focus",
    enabled: true,
    config: {},
    size: "M",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

function makeHost(overrides?: {
  layoutRun?: () => void
  layoutIcon?: string
  layoutLabel?: string
  layoutState?: unknown
  writeLayoutState?: (key: string, value: unknown) => void
}): LayoutHostAPI {
  const addWidget = vi.fn()
  return {
    getGlobalActions: (surface) =>
      surface === "rail"
        ? [
            { id: "home", label: "分组 我的工作台", icon: "T", run: vi.fn() },
            { id: "add-widget", label: "添加卡片", icon: "+", run: vi.fn() },
            {
              id: "layout-switch",
              label: overrides?.layoutLabel ?? "切换到专注",
              icon: overrides?.layoutIcon ?? "layout-focus",
              run: overrides?.layoutRun ?? vi.fn(),
            },
            { id: "theme", label: "切换主题", icon: "☼", run: vi.fn() },
            { id: "settings", label: "设置", icon: "⚙", run: vi.fn() },
          ]
        : surface === "menu"
          ? [{ id: "add-widget", label: "添加卡片", icon: "+", run: addWidget }]
          : [],
    openSettings: vi.fn(),
    openCommandPalette: vi.fn(),
    openAddWidget: vi.fn(),
    showToast: vi.fn(),
    readLayoutState: <T = unknown,>() => overrides?.layoutState as T | undefined,
    writeLayoutState: vi.fn((key, value) => overrides?.writeLayoutState?.(key, value)),
    toggleTheme: vi.fn(),
    isDark: () => false,
  }
}

function makeSlot(id: string, instances: PluginInstance[] = []): RegionSlot<JSX.Element> {
  return {
    regionId: id,
    title: id,
    accepts: ["widget"],
    instances,
    isEmpty: instances.length === 0,
    render: () => <div data-testid={`region-${id}`}>{id}</div>,
    renderInstance: (current) => <div data-testid={`instance-${current.id}`}>{current.id}</div>,
  }
}

describe("DashboardLayout", () => {
  it("渲染 rail 强制入口与 mainGrid", () => {
    const host = document.createElement("div")
    document.body.appendChild(host)
    const dispose = render(
      () => (
        <DashboardLayout
          isMobile={false}
          host={makeHost()}
          regions={{
            topbar: makeSlot("topbar"),
            mainGrid: makeSlot("mainGrid", [
              instance({ id: "weather-1", contributionId: "weather" }),
            ]),
          }}
        />
      ),
      host,
    )
    expect(host.querySelector("[data-layout='dashboard']")).toBeTruthy()
    expect(host.querySelector("[data-workbench-rail]")).toBeTruthy()
    const layoutGrid = host.querySelector<HTMLElement>("[data-layout-grid]")
    expect(layoutGrid).toBeTruthy()
    expect(layoutGrid!.className).not.toBe("")
    expect(host.querySelector(".layout-dashboard")).toBeNull()
    expect(host.querySelector("[data-testid='region-mainGrid']")).toBeTruthy()
    dispose()
  })

  it("persists rail groups through the layout host state and restores them on remount", () => {
    let stored: unknown
    const firstRoot = document.createElement("div")
    document.body.appendChild(firstRoot)
    const firstHost = makeHost({
      writeLayoutState: (_key, value) => {
        stored = value
      },
    })
    const disposeFirst = render(
      () => (
        <DashboardLayout
          isMobile={false}
          host={firstHost}
          regions={{ topbar: makeSlot("topbar"), mainGrid: makeSlot("mainGrid") }}
        />
      ),
      firstRoot,
    )

    firstRoot.querySelector<HTMLButtonElement>('button[aria-label="新建分组"]')?.click()
    const input = firstRoot.querySelector<HTMLInputElement>("[data-rail-inline-pop] input")
    input!.value = "Research"
    input!.dispatchEvent(new InputEvent("input", { bubbles: true }))
    input!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))
    disposeFirst()
    firstRoot.remove()

    const secondRoot = document.createElement("div")
    document.body.appendChild(secondRoot)
    const disposeSecond = render(
      () => (
        <DashboardLayout
          isMobile={false}
          host={makeHost({ layoutState: stored })}
          regions={{ topbar: makeSlot("topbar"), mainGrid: makeSlot("mainGrid") }}
        />
      ),
      secondRoot,
    )

    expect(secondRoot.querySelector('button[aria-label="分组 Research"]')).toBeTruthy()
    expect(secondRoot.textContent).toContain("暂无卡片")

    disposeSecond()
    secondRoot.remove()
  })

  it("rail plus creates a group instead of opening add-widget", () => {
    const host = document.createElement("div")
    document.body.appendChild(host)
    const layoutHost = makeHost()
    const dispose = render(
      () => (
        <DashboardLayout
          isMobile={false}
          host={layoutHost}
          regions={{ topbar: makeSlot("topbar"), mainGrid: makeSlot("mainGrid") }}
        />
      ),
      host,
    )

    host.querySelector<HTMLButtonElement>('button[aria-label="新建分组"]')?.click()
    expect(host.querySelector("[data-rail-inline-pop]")).toBeTruthy()
    const input = host.querySelector<HTMLInputElement>("[data-rail-inline-pop] input")
    input!.value = "Research"
    input!.dispatchEvent(new InputEvent("input", { bubbles: true }))
    input!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))

    expect(host.querySelector('button[aria-label="分组 Research"]')).toBeTruthy()
    expect(host.textContent).toContain("暂无卡片")
    expect(host.textContent).toContain("添加第一个")
    expect(layoutHost.openAddWidget).not.toHaveBeenCalled()
    expect(layoutHost.showToast).toHaveBeenCalledWith(
      "已创建分组「Research」 · 右键可改图标和布局",
      { type: "success" },
    )
    dispose()
  })

  it("rail group context menu supports icon changes, renaming, and deleting custom groups", () => {
    const host = document.createElement("div")
    document.body.appendChild(host)
    const prompt = vi.fn(() => "Lab")
    vi.stubGlobal("prompt", prompt)
    const layoutHost = makeHost()
    const dispose = render(
      () => (
        <DashboardLayout
          isMobile={false}
          host={layoutHost}
          regions={{ topbar: makeSlot("topbar"), mainGrid: makeSlot("mainGrid") }}
        />
      ),
      host,
    )

    host.querySelector<HTMLButtonElement>('button[aria-label="新建分组"]')?.click()
    const input = host.querySelector<HTMLInputElement>("[data-rail-inline-pop] input")
    input!.value = "Research"
    input!.dispatchEvent(new InputEvent("input", { bubbles: true }))
    input!.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))

    const groupButton = host.querySelector<HTMLButtonElement>('button[aria-label="分组 Research"]')
    groupButton?.dispatchEvent(
      new MouseEvent("contextmenu", { bubbles: true, clientX: 72, clientY: 88 }),
    )

    expect(host.querySelector("[data-group-menu]")).toBeTruthy()
    expect(host.querySelector("[data-group-menu]")?.textContent).toContain("重命名")
    host.querySelectorAll<HTMLButtonElement>("[data-group-menu-icon]")[3]?.click()
    expect(
      host.querySelector<HTMLButtonElement>('button[aria-label="分组 Research"]')?.textContent,
    ).toContain("★")
    expect(layoutHost.showToast).toHaveBeenCalledWith("已更新「Research」图标", {
      type: "success",
    })

    host.querySelector<HTMLButtonElement>("[data-group-menu-item]")?.click()
    expect(host.querySelector('button[aria-label="分组 Lab"]')).toBeTruthy()
    expect(layoutHost.showToast).toHaveBeenCalledWith("已重命名为「Lab」", {
      type: "success",
    })

    host
      .querySelector<HTMLButtonElement>('button[aria-label="分组 Lab"]')
      ?.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, clientX: 72, clientY: 88 }))
    host.querySelector<HTMLButtonElement>("[data-group-menu-item][data-danger]")?.click()

    expect(host.querySelector('button[aria-label="分组 Lab"]')).toBeFalsy()
    expect(host.querySelector('button[aria-label="分组 我的工作台"]')).toBeTruthy()
    expect(layoutHost.showToast).toHaveBeenCalledWith("已删除「Lab」", { type: "success" })

    vi.unstubAllGlobals()
    dispose()
  })

  it("rail layout button opens prototype switch popover before running layout action", async () => {
    const host = document.createElement("div")
    document.body.appendChild(host)
    const layoutRun = vi.fn()
    const dispose = render(
      () => (
        <DashboardLayout
          isMobile={false}
          host={makeHost({ layoutRun })}
          regions={{ topbar: makeSlot("topbar"), mainGrid: makeSlot("mainGrid") }}
        />
      ),
      host,
    )

    host
      .querySelector<HTMLButtonElement>('button[aria-label="切换布局"]')
      ?.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, pointerType: "mouse", button: 0 }),
      )
    const menu = document.querySelector('[role="menu"]')
    expect(menu).toBeTruthy()
    expect(menu?.textContent).toContain("Dashboard")
    expect(menu?.textContent).toContain("控制面板：多卡片并列")
    expect(menu?.textContent).toContain("Focus")
    expect(menu?.textContent).toContain("深度专注：主卡 + 卫星")

    const items = document.querySelectorAll<HTMLElement>('[role="menuitem"]')
    expect(items.length).toBe(2)
    expect(items[0]?.hasAttribute("data-checked")).toBe(true)

    items[0]?.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, pointerType: "mouse", button: 0 }),
    )
    await Promise.resolve()
    expect(layoutRun).not.toHaveBeenCalled()
    const menuAfterSelect = document.querySelector('[role="menu"]')
    expect(!menuAfterSelect || menuAfterSelect.hasAttribute("data-closed")).toBe(true)

    host
      .querySelector<HTMLButtonElement>('button[aria-label="切换布局"]')
      ?.dispatchEvent(
        new PointerEvent("pointerdown", { bubbles: true, pointerType: "mouse", button: 0 }),
      )
    const items2 = document.querySelectorAll<HTMLElement>('[role="menuitem"]')
    items2[1]?.dispatchEvent(
      new PointerEvent("pointerup", { bubbles: true, pointerType: "mouse", button: 0 }),
    )
    await Promise.resolve()
    expect(layoutRun).toHaveBeenCalledTimes(1)
    const menuAfterSelect2 = document.querySelector('[role="menu"]')
    expect(!menuAfterSelect2 || menuAfterSelect2.hasAttribute("data-closed")).toBe(true)
    dispose()
  })
})

describe("FocusLayout", () => {
  it("渲染 rail、focus hero 和 satellite 切换入口", () => {
    const host = document.createElement("div")
    document.body.appendChild(host)
    const dispose = render(
      () => (
        <FocusLayout
          isMobile={false}
          host={makeHost()}
          regions={{
            focus: {
              ...makeSlot("focus"),
              instances: [
                instance({
                  id: "weather-1",
                  pluginId: "official.widgets.weather",
                  contributionId: "weather",
                  size: "M",
                }),
                instance({
                  id: "todo-1",
                  pluginId: "official.widgets.todo",
                  contributionId: "todo",
                  size: "S",
                }),
              ],
              renderInstance: (instance) => <div data-testid={`focus-instance-${instance.id}`} />,
            },
          }}
        />
      ),
      host,
    )
    expect(host.querySelector("[data-workbench-rail]")).toBeTruthy()
    expect(host.querySelector("[data-layout='focus']")).toBeTruthy()
    expect(host.querySelector("[data-testid='focus-instance-weather-1']")).toBeTruthy()
    expect(host.querySelector("button[data-focus-satellite]")).toBeTruthy()
    dispose()
  })
})

describe("layoutDashboard manifest", () => {
  it("在同一个插件中声明 dashboard 和 focus 两个布局", () => {
    const layouts = layoutDashboard.manifest.contributes.layouts!
    expect(layouts.map((layout) => layout.id)).toEqual([
      "official.layout.workbench-dashboard",
      "official.layout.workbench-focus",
    ])
    expect(layouts.every((layout) => layout.view)).toBe(true)
    expect(layouts[1]!.regions).toEqual([
      { id: "focus", title: "专注卡片", accepts: ["widget"], required: true },
    ])
  })
})
