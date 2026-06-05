import { describe, expect, it, vi } from "vitest"
import { createCommandCatalog, createCommandPaletteCommands } from "./command-catalog"
import { createCommandPaletteItems } from "./command-palette-model"

describe("createCommandCatalog", () => {
  it("returns platform command entries with registered actions", () => {
    const action = vi.fn()
    const catalog = createCommandCatalog({
      platformCommands: [
        {
          id: "shell.open-settings",
          title: "打开设置",
          description: "配置工作台",
          icon: "S",
          category: "workspace",
          defaultShortcut: "mod+,",
        },
      ],
      actions: {
        "shell.open-settings": action,
      },
    })

    const entries = catalog.listCommandEntries()

    expect(entries).toHaveLength(1)
    expect(entries[0]).toMatchObject({
      id: "shell.open-settings",
      icon: "S",
      name: "打开设置",
      desc: "配置工作台",
      shortcut: "mod+,",
    })

    entries[0]!.action()
    expect(action).toHaveBeenCalledOnce()
  })

  it("sorts plugin command entries after platform commands by category and title", () => {
    const entries = createCommandPaletteCommands({
      platformCommands: [
        {
          id: "shell.add-widget",
          title: "添加卡片",
          category: "workspace",
        },
      ],
      pluginCommands: [
        {
          id: "plugin.todo.today",
          title: "今日待办",
          category: "widgets",
        },
        {
          id: "plugin.notes.create",
          title: "新建便签",
          category: "notes",
        },
      ],
      actions: {
        "shell.add-widget": vi.fn(),
        "plugin.todo.today": vi.fn(),
        "plugin.notes.create": vi.fn(),
      },
    })

    expect(entries.map((entry) => entry.id)).toEqual([
      "shell.add-widget",
      "plugin.notes.create",
      "plugin.todo.today",
    ])
  })

  it("includes keywords in command palette search text without changing entry consumers", () => {
    const entries = createCommandPaletteCommands({
      platformCommands: [],
      pluginCommands: [
        {
          id: "plugin.notes.create",
          title: "新建便签",
          description: "创建一条文字记录",
          category: "notes",
          keywords: ["memo", "scratchpad"],
        },
      ],
      actions: {
        "plugin.notes.create": vi.fn(),
      },
    })

    const items = createCommandPaletteItems({ query: "scratchpad", commands: entries })

    expect(items.map((item) => item.id)).toEqual(["plugin.notes.create"])
  })

  it("filters commands when required capabilities are not supported", () => {
    const entries = createCommandPaletteCommands({
      platformCommands: [
        {
          id: "shell.open-settings",
          title: "打开设置",
          category: "workspace",
        },
      ],
      pluginCommands: [
        {
          id: "plugin.clipboard.copy",
          title: "复制摘要",
          category: "clipboard",
          requiredCapabilities: ["clipboard.write"],
        },
      ],
      actions: {
        "shell.open-settings": vi.fn(),
        "plugin.clipboard.copy": vi.fn(),
      },
      supportedCapabilities: ["workspace.read"],
    })

    expect(entries.map((entry) => entry.id)).toEqual(["shell.open-settings"])
  })

  it("filters required-capability commands until host capabilities are explicit", () => {
    const entries = createCommandPaletteCommands({
      platformCommands: [],
      pluginCommands: [
        {
          id: "plugin.clipboard.copy",
          title: "复制摘要",
          category: "clipboard",
          requiredCapabilities: ["clipboard.write"],
        },
      ],
      actions: {
        "plugin.clipboard.copy": vi.fn(),
      },
    })

    expect(entries).toEqual([])
  })

  it("skips commands without registered actions", () => {
    const entries = createCommandPaletteCommands({
      platformCommands: [],
      pluginCommands: [
        {
          id: "plugin.unknown.action",
          title: "未知动作",
          category: "debug",
        },
      ],
      actions: {},
    })

    expect(entries).toEqual([])
  })
})
