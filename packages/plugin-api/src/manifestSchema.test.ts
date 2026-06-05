import { describe, expect, it } from "vitest"
import { pluginManifestSchema } from "./manifestSchema"

describe("pluginManifestSchema", () => {
  it("accepts a plugin that contributes a widget", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.widgets.productivity",
      name: "Productivity Widgets",
      version: "0.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {
        widgets: [
          {
            id: "notes",
            title: "便签",
            supportedSizes: ["S", "M", "L"],
            defaultSize: "M",
            allowMultipleInstances: true,
            views: { card: "official.notes.card", modal: "official.notes.modal" },
          },
        ],
      },
    })

    expect(result.success).toBe(true)
  })

  it("accepts widget context menu contributions", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.widgets.notes",
      name: "Notes Widget",
      version: "0.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {
        widgets: [
          {
            id: "notes",
            title: "便签",
            supportedSizes: ["S", "M", "L"],
            defaultSize: "M",
            allowMultipleInstances: true,
            views: { card: "official.notes.card" },
            contextMenus: [
              {
                id: "notes.clear",
                label: "清空便签",
                commandId: "official.notes.clear",
                order: 30,
                danger: true,
                when: "widget",
              },
            ],
          },
        ],
      },
    })

    expect(result.success).toBe(true)
    expect(
      result.success ? result.data.contributes.widgets?.[0]?.contextMenus?.[0]?.danger : undefined,
    ).toBe(true)
  })

  it("rejects widget context menu contributions without id or label", () => {
    const baseWidget = {
      id: "notes",
      title: "便签",
      supportedSizes: ["S", "M"],
      defaultSize: "M",
      allowMultipleInstances: true,
      views: { card: "official.notes.card" },
    }

    for (const contextMenu of [
      { label: "清空便签", commandId: "official.notes.clear" },
      { id: "notes.clear", commandId: "official.notes.clear" },
    ]) {
      const result = pluginManifestSchema.safeParse({
        id: "bad.widget.context-menu",
        name: "Bad Widget Context Menu",
        version: "0.0.0",
        entry: "./entry",
        engine: { platform: "^0.1.0" },
        contributes: {
          widgets: [
            {
              ...baseWidget,
              contextMenus: [contextMenu],
            },
          ],
        },
      })

      expect(result.success).toBe(false)
    }
  })

  it("rejects a widget whose default size is not supported", () => {
    const result = pluginManifestSchema.safeParse({
      id: "bad.widgets",
      name: "Bad Widgets",
      version: "0.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {
        widgets: [
          {
            id: "notes",
            title: "便签",
            supportedSizes: ["S"],
            defaultSize: "XL",
            allowMultipleInstances: true,
            views: { card: "bad.notes.card" },
          },
        ],
      },
    })

    expect(result.success).toBe(false)
  })

  it("accepts a dashboard layout contribution with a registered view", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.layout.workbench-dashboard",
      name: "Workbench Dashboard Layout",
      version: "0.0.0",
      entry: "./layout-workbench-dashboard",
      engine: { platform: "^0.1.0" },
      contributes: {
        layouts: [
          {
            id: "official.layout.workbench-dashboard",
            title: "工作台仪表盘布局",
            view: "official.layout.workbench-dashboard.view",
            regions: [
              {
                id: "rail",
                title: "工作台导航",
                accepts: ["layout"],
                required: true,
                maxInstances: 1,
              },
              {
                id: "topbar",
                title: "顶部搜索区",
                accepts: ["search"],
                required: true,
                maxInstances: 1,
              },
              {
                id: "mainGrid",
                title: "主网格",
                accepts: ["widget"],
                required: true,
              },
            ],
            defaultRegions: {
              rail: [],
              topbar: [{ instanceId: "search-main" }],
              mainGrid: [
                { instanceId: "today-focus-1" },
                { instanceId: "quick-links-1" },
                { instanceId: "notes-1" },
                { instanceId: "todo-1" },
              ],
            },
            supportsResponsive: true,
          },
        ],
      },
    })

    expect(result.success).toBe(true)
    expect(result.success ? result.data.contributes.layouts?.[0]?.view : undefined).toBe(
      "official.layout.workbench-dashboard.view",
    )
  })

  it("rejects settings panels without explicit section and scope", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.settings.workspace",
      name: "Workspace Settings",
      version: "0.0.0",
      entry: "./settings-workspace",
      engine: { platform: "^0.1.0" },
      contributes: {
        settingsPanels: [
          {
            id: "official.settings.workspace.appearance",
            title: "外观",
            view: "official.settings.workspace.appearance.view",
            order: 20,
          },
        ],
      },
    })

    expect(result.success).toBe(false)
  })

  it("accepts explicit settings panel section and scope", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.settings.workspace",
      name: "Workspace Settings",
      version: "0.0.0",
      entry: "./settings-workspace",
      engine: { platform: "^0.1.0" },
      contributes: {
        settingsPanels: [
          {
            id: "official.settings.workspace.appearance",
            title: "外观",
            view: "official.settings.workspace.appearance.view",
            section: "appearance",
            scope: "workspace",
            order: 20,
          },
          {
            id: "official.widget.notes.settings",
            title: "便签实例",
            view: "official.widget.notes.settings.view",
            section: "general",
            scope: "instance",
          },
        ],
      },
    })

    expect(result.success).toBe(true)
    expect(result.success ? result.data.contributes.settingsPanels?.[0]?.section : undefined).toBe(
      "appearance",
    )
    expect(result.success ? result.data.contributes.settingsPanels?.[1]?.scope : undefined).toBe(
      "instance",
    )
  })

  it("accepts a command contribution", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.commands.workspace",
      name: "Workspace Commands",
      version: "0.0.0",
      entry: "./commands",
      engine: { platform: "^0.1.0" },
      contributes: {
        commands: [
          {
            id: "official.command.add-widget",
            title: "添加卡片",
            description: "向工作台添加新卡片",
            icon: "+",
            category: "workspace",
            keywords: ["widget", "card"],
            defaultShortcut: "mod+n",
            requiredCapabilities: ["workspace.write"],
          },
        ],
      },
    })

    expect(result.success).toBe(true)
  })

  it("rejects a command contribution without id, title, or category", () => {
    const baseManifest = {
      id: "bad.commands",
      name: "Bad Commands",
      version: "0.0.0",
      entry: "./commands",
      engine: { platform: "^0.1.0" },
    }

    for (const command of [
      { title: "添加卡片", category: "workspace" },
      { id: "bad.command.add-widget", category: "workspace" },
      { id: "bad.command.add-widget", title: "添加卡片" },
    ]) {
      const result = pluginManifestSchema.safeParse({
        ...baseManifest,
        contributes: {
          commands: [command],
        },
      })

      expect(result.success).toBe(false)
    }
  })

  it("accepts a keybinding contribution", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.keybindings.workspace",
      name: "Workspace Keybindings",
      version: "0.0.0",
      entry: "./keybindings",
      engine: { platform: "^0.1.0" },
      contributes: {
        keybindings: [
          {
            id: "official.keybinding.open-settings",
            commandId: "open-settings",
            key: "mod+,",
            platform: "mac",
            when: "workspace",
            editable: true,
          },
        ],
      },
    })

    expect(result.success).toBe(true)
  })

  it("rejects a keybinding contribution without id, commandId, or key", () => {
    const baseManifest = {
      id: "bad.keybindings",
      name: "Bad Keybindings",
      version: "0.0.0",
      entry: "./keybindings",
      engine: { platform: "^0.1.0" },
    }

    for (const keybinding of [
      { commandId: "open-settings", key: "mod+," },
      { id: "bad.keybinding.open-settings", key: "mod+," },
      { id: "bad.keybinding.open-settings", commandId: "open-settings" },
    ]) {
      const result = pluginManifestSchema.safeParse({
        ...baseManifest,
        contributes: {
          keybindings: [keybinding],
        },
      })

      expect(result.success).toBe(false)
    }
  })

  it("rejects a layout contribution with an empty view", () => {
    const result = pluginManifestSchema.safeParse({
      id: "bad.layout",
      name: "Bad Layout",
      version: "0.0.0",
      entry: "./layout",
      engine: { platform: "^0.1.0" },
      contributes: {
        layouts: [
          {
            id: "bad.layout",
            title: "Bad Layout",
            view: "",
            regions: [
              {
                id: "mainGrid",
                title: "Main Grid",
                accepts: ["widget"],
              },
            ],
            defaultRegions: {
              mainGrid: [],
            },
            supportsResponsive: true,
          },
        ],
      },
    })

    expect(result.success).toBe(false)
  })
})

describe("layout 最小强制规则", () => {
  const baseLayout = {
    id: "x.layout",
    title: "X",
    view: "x.layout.view",
    regions: [{ id: "grid", title: "网格", accepts: ["widget"], required: true }],
    defaultRegions: { grid: [] },
    supportsResponsive: true,
  }

  function manifestWith(layout: unknown) {
    return {
      id: "x",
      name: "X",
      version: "1.0.0",
      entry: "./x",
      engine: { platform: "^0.1.0" },
      contributes: { layouts: [layout] },
    }
  }

  it("合格：含 widget region + view", () => {
    expect(pluginManifestSchema.safeParse(manifestWith(baseLayout)).success).toBe(true)
  })

  it("不合格：无 widget region", () => {
    const layout = {
      ...baseLayout,
      regions: [{ id: "side", title: "侧栏", accepts: ["search"], required: false }],
    }
    expect(pluginManifestSchema.safeParse(manifestWith(layout)).success).toBe(false)
  })

  it("不合格：缺 view 字段", () => {
    const { view: _view, ...noView } = baseLayout
    expect(pluginManifestSchema.safeParse(manifestWith(noView)).success).toBe(false)
  })

  it("合格：缺 search/settings region 仍通过", () => {
    expect(pluginManifestSchema.safeParse(manifestWith(baseLayout)).success).toBe(true)
  })
})
