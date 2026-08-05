import { describe, expect, it } from "vitest"
import { pluginManifestSchema, validatePluginManifestComposition } from "./manifestSchema"

function cssRgb(channels: readonly number[]) {
  return ["rgb", `(${channels.join(", ")})`].join("")
}

describe("pluginManifestSchema", () => {
  it("rejects a manifest without explicit apiVersion", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.widgets.productivity",
      name: "Productivity Widgets",
      version: "0.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {},
    })

    expect(result.success).toBe(false)
  })

  it("accepts a plugin that contributes a widget", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.widgets.productivity",
      name: "Productivity Widgets",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {
        commands: [
          { id: "official.widgets.productivity.clear", title: "Clear", category: "widget" },
        ],
        widgets: [
          {
            id: "notes",
            title: "便签",
            supportedSizes: ["S", "M", "L"],
            defaultSize: "M",
            allowMultipleInstances: true,
            views: {
              card: "official.widgets.productivity.card",
              expand: "official.widgets.productivity.expand",
            },
          },
        ],
      },
    })

    expect(result.success).toBe(true)
  })

  it("accepts a widget with an explicit expand view contract", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.widgets.notes",
      name: "Notes Widget",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {
        commands: [{ id: "official.widgets.notes.clear", title: "Clear", category: "widget" }],
        widgets: [
          {
            id: "notes",
            title: "便签",
            supportedSizes: ["S", "M", "L"],
            defaultSize: "M",
            allowMultipleInstances: true,
            views: {
              card: "official.widgets.notes.card",
              expand: "official.widgets.notes.expand",
              settings: "official.widgets.notes.settings",
            },
          },
        ],
      },
    })

    expect(result.success).toBe(true)
  })

  it("rejects historical migration host capabilities", () => {
    const result = pluginManifestSchema.safeParse({
      id: "legacy.migration.plugin",
      name: "Legacy Migration Plugin",
      version: "0.0.0",
      apiVersion: "1.0.0",
      requiredCapabilities: ["legacyMigration"],
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {},
    })

    expect(result.success).toBe(false)
  })

  it("accepts declared external-open permissions", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.search.command-bar",
      name: "Search",
      version: "1.0.0",
      apiVersion: "1.0.0",
      entry: "./index",
      engine: { platform: "^0.1.0" },
      permissions: [{ type: "external-open", hosts: ["github.com"] }],
      contributes: {},
    })

    expect(result.success).toBe(true)
  })

  it("accepts declared AI permissions", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.ai.assistant",
      name: "AI Assistant",
      version: "1.0.0",
      apiVersion: "1.0.0",
      entry: "./index",
      engine: { platform: "^0.1.0" },
      permissions: [{ type: "ai", access: ["generate", "context", "tools"] }],
      contributes: {},
    })

    expect(result.success).toBe(true)
  })

  it("accepts AI settings panel sections", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.settings.ai",
      name: "AI Settings",
      version: "1.0.0",
      apiVersion: "1.0.0",
      entry: "./index",
      engine: { platform: "^0.1.0" },
      contributes: {
        settingsPanels: [
          {
            id: "official.settings.ai",
            title: "AI",
            content: { kind: "custom-view", view: "official.settings.ai.view" },
            section: "ai",
            scope: "global",
          },
        ],
      },
    })

    expect(result.success).toBe(true)
  })

  it("accepts plugin stylesheet declarations", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.widgets.productivity",
      name: "Productivity Widgets",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      styles: [
        {
          href: "./styles.css",
          scope: "plugin",
          order: 10,
        },
      ],
      contributes: {},
    })

    expect(result.success).toBe(true)
  })

  it("rejects malformed plugin stylesheet declarations", () => {
    const result = pluginManifestSchema.safeParse({
      id: "bad.styles",
      name: "Bad Styles",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      styles: [
        {
          href: "",
          scope: "document",
        },
      ],
      contributes: {},
    })

    expect(result.success).toBe(false)
  })

  it("rejects malformed plugin permissions", () => {
    const result = pluginManifestSchema.safeParse({
      id: "bad.permissions",
      name: "Bad Permissions",
      version: "1.0.0",
      apiVersion: "1.0.0",
      entry: "./index",
      engine: { platform: "^0.1.0" },
      permissions: [{ type: "external-open", hosts: "github.com" }],
      contributes: {},
    })

    expect(result.success).toBe(false)
  })

  it("accepts widget context menu contributions", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.widgets.notes",
      name: "Notes Widget",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./entry",
      engine: { platform: "^0.1.0" },
      contributes: {
        commands: [{ id: "official.widgets.notes.clear", title: "Clear", category: "widget" }],
        widgets: [
          {
            id: "notes",
            title: "便签",
            supportedSizes: ["S", "M", "L"],
            defaultSize: "M",
            allowMultipleInstances: true,
            views: { card: "official.widgets.notes.card" },
            contextMenus: [
              {
                id: "notes.clear",
                label: "清空便签",
                commandId: "official.widgets.notes.clear",
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
      views: { card: "official.widgets.productivity.card" },
    }

    for (const contextMenu of [
      { label: "清空便签", commandId: "official.widgets.productivity.clear" },
      { id: "notes.clear", commandId: "official.widgets.productivity.clear" },
    ]) {
      const result = pluginManifestSchema.safeParse({
        id: "bad.widget.context-menu",
        name: "Bad Widget Context Menu",
        version: "0.0.0",
        apiVersion: "1.0.0",
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
      apiVersion: "1.0.0",
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
      apiVersion: "1.0.0",
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
      apiVersion: "1.0.0",
      entry: "./settings-workspace",
      engine: { platform: "^0.1.0" },
      contributes: {
        settingsPanels: [
          {
            id: "official.settings.workspace.appearance",
            title: "外观",
            content: {
              kind: "custom-view",
              view: "official.settings.workspace.appearance.view",
            },
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
      apiVersion: "1.0.0",
      entry: "./settings-workspace",
      engine: { platform: "^0.1.0" },
      contributes: {
        settingsPanels: [
          {
            id: "official.settings.workspace.appearance",
            title: "外观",
            content: {
              kind: "custom-view",
              view: "official.settings.workspace.appearance.view",
            },
            section: "appearance",
            scope: "workspace",
            order: 20,
          },
          {
            id: "official.settings.workspace.notes.settings",
            title: "便签实例",
            content: {
              kind: "custom-view",
              view: "official.settings.workspace.notes.settings.view",
            },
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

  it("accepts an explicitly versioned schema settings provider", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.account-sync",
      name: "Account Sync",
      version: "1.0.0",
      apiVersion: "1.0.0",
      entry: "./account-sync",
      engine: { platform: "^0.1.0" },
      contributes: {
        settingsPanels: [
          {
            id: "official.settings.account",
            title: "账号",
            section: "account",
            scope: "global",
            content: {
              kind: "schema",
              provider: "official.account-sync.account.provider",
              schemaVersion: 1,
            },
          },
        ],
      },
    })

    expect(result.success).toBe(true)
  })

  it("rejects the removed settings view field even when content is explicit", () => {
    const result = pluginManifestSchema.safeParse({
      id: "legacy.settings",
      name: "Legacy Settings",
      version: "1.0.0",
      apiVersion: "1.0.0",
      entry: "./settings",
      engine: { platform: "^0.1.0" },
      contributes: {
        settingsPanels: [
          {
            id: "legacy.settings.panel",
            title: "Legacy",
            view: "legacy.settings.view",
            section: "general",
            scope: "workspace",
            content: { kind: "custom-view", view: "legacy.settings.view" },
          },
        ],
      },
    })

    expect(result.success).toBe(false)
  })

  it("accepts background provider source values", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.background.basic",
      name: "Basic Background",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./background-basic",
      engine: { platform: "^0.1.0" },
      contributes: {
        backgroundRenderers: [
          {
            id: "background.canvas.renderer",
            title: "Canvas renderer",
            accepts: ["canvas"],
            view: "official.background.basic.canvas.view",
          },
        ],
        backgroundProviders: [
          {
            id: "background.css",
            title: "CSS",
            sourceType: "generated",
            source: { type: "css", css: { background: cssRgb([1, 2, 3]) } },
          },
          {
            id: "background.gradient",
            title: "Gradient",
            sourceType: "generated",
            source: { type: "gradient", css: "linear-gradient(red, blue)" },
          },
          {
            id: "background.image",
            title: "Image",
            sourceType: "remote",
            source: { type: "image", url: "https://example.com/image.jpg", fit: "cover" },
          },
          {
            id: "background.video",
            title: "Video",
            sourceType: "remote",
            source: { type: "video", url: "https://example.com/video.mp4" },
          },
          {
            id: "background.canvas",
            title: "Canvas",
            sourceType: "generated",
            source: { type: "canvas", view: "official.background.basic.canvas.view" },
          },
        ],
      },
    })

    expect(result.success).toBe(true)
  })

  it("accepts a background renderer for css and gradient sources", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.background.basic",
      name: "Basic Background",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./background-basic",
      engine: { platform: "^0.1.0" },
      contributes: {
        backgroundRenderers: [
          {
            id: "official.background.css-renderer",
            title: "CSS 背景渲染器",
            accepts: ["css", "gradient"],
            view: "official.background.basic.css-renderer.view",
          },
        ],
      },
    })

    expect(result.success).toBe(true)
  })

  it("rejects unsupported background renderer source types", () => {
    const result = pluginManifestSchema.safeParse({
      id: "bad.background.renderer",
      name: "Bad Background Renderer",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./background-basic",
      engine: { platform: "^0.1.0" },
      contributes: {
        backgroundRenderers: [
          {
            id: "bad.background.webgl-renderer",
            title: "WebGL 背景渲染器",
            accepts: ["webgl"],
            view: "bad.background.webgl-renderer.view",
          },
        ],
      },
    })

    expect(result.success).toBe(false)
  })

  it("rejects workspace presets whose widget instances omit explicit size", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.workspace-presets",
      name: "Workspace Presets",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./workspace-presets",
      engine: { platform: "^0.1.0" },
      contributes: {
        workspacePresets: [
          {
            id: "official.workspace.default",
            title: "默认工作区",
            plugins: ["official.widgets.todo"],
            layout: {
              pluginId: "official.layout",
              kind: "layout",
              id: "official.layout.workbench-dashboard",
            },
            theme: { pluginId: "official.theme", kind: "theme", id: "official.theme.light" },
            backgroundProvider: {
              pluginId: "official.background",
              kind: "background-provider",
              id: "background.gradient-green",
            },
            search: {
              defaultProvider: {
                pluginId: "official.search",
                kind: "search-provider",
                id: "official.search.google",
              },
              enabledProviders: [
                {
                  pluginId: "official.search",
                  kind: "search-provider",
                  id: "official.search.google",
                },
              ],
            },
            regions: [{ regionId: "mainGrid", accepts: ["widget"] }],
            instances: [
              {
                instanceId: "todo-1",
                contribution: {
                  pluginId: "official.widgets.todo",
                  kind: "widget",
                  id: "todo",
                },
                regionId: "mainGrid",
              },
            ],
          },
        ],
      },
    })

    expect(result.success).toBe(false)
  })

  it("accepts a command contribution", () => {
    const result = pluginManifestSchema.safeParse({
      id: "official.commands.workspace",
      name: "Workspace Commands",
      version: "0.0.0",
      apiVersion: "1.0.0",
      entry: "./commands",
      engine: { platform: "^0.1.0" },
      contributes: {
        commands: [
          {
            id: "official.commands.workspace.add-widget",
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
      apiVersion: "1.0.0",
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
      apiVersion: "1.0.0",
      entry: "./keybindings",
      engine: { platform: "^0.1.0" },
      contributes: {
        commands: [
          {
            id: "official.keybindings.workspace.open-settings",
            title: "Open settings",
            category: "workspace",
          },
        ],
        keybindings: [
          {
            id: "official.keybindings.workspace.open-settings",
            commandId: "official.keybindings.workspace.open-settings",
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
      apiVersion: "1.0.0",
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
      apiVersion: "1.0.0",
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

  it("rejects duplicate local contribution IDs in the same contribution kind", () => {
    const result = pluginManifestSchema.safeParse({
      id: "example.duplicate-contributions",
      name: "Duplicate contributions",
      version: "1.0.0",
      apiVersion: "1.0.0",
      entry: "./index",
      engine: { platform: "^0.1.0" },
      contributes: {
        commands: [
          { id: "duplicate", title: "First", category: "example" },
          { id: "duplicate", title: "Second", category: "example" },
        ],
      },
    })

    expect(result.success).toBe(false)
  })

  it("rejects registration IDs that belong to another plugin namespace", () => {
    const result = pluginManifestSchema.safeParse({
      id: "example.owner",
      name: "Owner test",
      version: "1.0.0",
      apiVersion: "1.0.0",
      entry: "./index",
      engine: { platform: "^0.1.0" },
      contributes: {
        commands: [{ id: "example.other.run", title: "Run", category: "test" }],
        widgets: [
          {
            id: "widget",
            title: "Widget",
            supportedSizes: ["S"],
            defaultSize: "S",
            allowMultipleInstances: false,
            views: { card: "example.other.widget.view" },
          },
        ],
      },
    })

    expect(result.success).toBe(false)
  })

  it("rejects region contributions that are not renderable region content", () => {
    const result = pluginManifestSchema.safeParse({
      id: "example.invalid-region-kind",
      name: "Invalid region kind",
      version: "1.0.0",
      apiVersion: "1.0.0",
      entry: "./index",
      engine: { platform: "^0.1.0" },
      contributes: {
        layouts: [
          {
            id: "main",
            title: "Main",
            view: "example.main.view",
            regions: [
              { id: "main", title: "Main", accepts: ["theme"], required: true },
              { id: "widgets", title: "Widgets", accepts: ["widget"], required: true },
            ],
            defaultRegions: { main: [], widgets: [] },
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
      apiVersion: "1.0.0",
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

describe("validatePluginManifestComposition", () => {
  const base = {
    name: "Plugin",
    version: "1.0.0",
    apiVersion: "1.0.0",
    entry: "./index",
    engine: { platform: "^0.1.0" },
  }

  it("rejects unresolved preset plugin, contribution, and layout default instance references", () => {
    expect(() =>
      validatePluginManifestComposition([
        {
          ...base,
          id: "example.layout",
          contributes: {
            layouts: [
              {
                id: "layout",
                title: "Layout",
                view: "example.layout.view",
                regions: [{ id: "grid", title: "Grid", accepts: ["widget"] }],
                defaultRegions: { grid: [{ instanceId: "missing" }] },
                supportsResponsive: true,
              },
            ],
          },
        },
        {
          ...base,
          id: "example.preset",
          contributes: {
            workspacePresets: [
              {
                id: "preset",
                title: "Preset",
                plugins: ["example.layout", "missing.plugin"],
                layout: { pluginId: "example.layout", kind: "layout", id: "layout" },
                theme: { pluginId: "missing.plugin", kind: "theme", id: "missing-theme" },
                backgroundProvider: {
                  pluginId: "missing.plugin",
                  kind: "background-provider",
                  id: "missing-background",
                },
                search: {
                  defaultProvider: {
                    pluginId: "missing.plugin",
                    kind: "search-provider",
                    id: "missing-provider",
                  },
                  enabledProviders: [
                    {
                      pluginId: "missing.plugin",
                      kind: "search-provider",
                      id: "missing-provider",
                    },
                  ],
                },
                regions: [{ regionId: "grid", accepts: ["widget"] }],
                instances: [
                  {
                    instanceId: "widget-1",
                    contribution: { pluginId: "missing.plugin", kind: "widget", id: "missing" },
                    regionId: "grid",
                    size: "S",
                  },
                ],
              },
            ],
          },
        },
      ]),
    ).toThrow("Invalid plugin manifest composition")
  })
})
