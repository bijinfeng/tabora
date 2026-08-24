import { describe, expect, it, vi } from "vitest"
import { createCommandPaletteItems } from "@tabora/orchestrator"

import { createWorkbenchShellCommandModels } from "./WorkbenchShellCommands"

function createOptions(
  overrides: Partial<Parameters<typeof createWorkbenchShellCommandModels>[0]> = {},
): Parameters<typeof createWorkbenchShellCommandModels>[0] {
  const base: Parameters<typeof createWorkbenchShellCommandModels>[0] = {
    isDark: () => false,
    pluginCommands: [],
    pluginKeybindings: [],
    setCommandPaletteOpen: vi.fn(),
    setAddWidgetOpen: vi.fn(),
    openSettings: vi.fn(),
    showToast: vi.fn(),
    switchTheme: vi.fn(),
    shellConfig: {
      themeIds: {
        light: "theme.light.custom",
        dark: "theme.dark.custom",
      },
      layoutIds: {
        dashboard: "layout.dashboard.custom",
      },
      settingsPanelIds: {
        appearance: "settings.appearance.custom",
      },
      searchHistory: {
        pluginId: "search.plugin.custom",
        key: "search-history-custom",
      },
    },
  }

  return { ...base, ...overrides }
}

describe("createWorkbenchShellCommandModels", () => {
  it("uses injected shell ids for theme toggle and settings entry", async () => {
    const options = createOptions()
    const models = createWorkbenchShellCommandModels(options)

    await models.runCommand("toggle-theme", {})
    await models.runCommand("open-settings", {})
    await models.runCommand("open-plugin-manager", {})

    expect(options.switchTheme).toHaveBeenCalledWith("theme.dark.custom")
    expect(options.openSettings).toHaveBeenCalledWith("settings.appearance.custom")
    expect(options.openSettings).toHaveBeenCalledWith("official.settings.plugins")
  })

  it("exposes plugin management as a first-class command", () => {
    const models = createWorkbenchShellCommandModels(createOptions())

    expect(models.commandItems().map((command) => command.name)).toContain("打开插件管理")
    expect(models.commandItems().map((command) => [command.name, command.icon])).toEqual(
      expect.arrayContaining([
        ["切换主题", "theme"],
        ["打开插件管理", "puzzle"],
        ["打开设置", "settings"],
      ]),
    )
  })

  it("matches visible command labels in command search", () => {
    const models = createWorkbenchShellCommandModels(createOptions())

    expect(
      createCommandPaletteItems({
        query: "plugin",
        commands: models.commandItems(),
      }).map((item) => item.id),
    ).toContain("open-plugin-manager")
  })

  it("uses tShell for platform command labels and shortcut toast", async () => {
    const showToast = vi.fn()
    const models = createWorkbenchShellCommandModels(
      createOptions({
        showToast,
        tShell: (key: string, vars?: Record<string, string | number>) => {
          const messages: Record<string, string> = {
            "commands.openPluginManager.title": "Open plugin manager",
            "commands.toggleTheme.title": "Toggle theme",
            "commands.openSettings.title": "Open settings",
            "commands.openShortcuts.separator": ", ",
            "commands.openShortcuts.toast": "Shortcuts: {{shortcuts}}, Esc",
          }
          const template = messages[key] ?? key
          return template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(vars?.[k] ?? ""))
        },
      }),
    )

    expect(models.commandItems().map((command) => command.name)).toContain("Open plugin manager")
    expect(models.commandItems().map((command) => [command.name, command.icon])).toEqual(
      expect.arrayContaining([
        ["Toggle theme", "theme"],
        ["Open plugin manager", "puzzle"],
        ["Open settings", "settings"],
      ]),
    )

    await models.runCommand("open-shortcuts", {})
    expect(showToast).toHaveBeenCalledWith(expect.stringContaining("Shortcuts:"))
  })

  it("keeps command failures observable for programmatic callers and contained at palette and shortcut edges", async () => {
    const showToast = vi.fn()
    const runPluginCommand = vi.fn(async () => {
      throw new Error("plugin command failed")
    })
    const models = createWorkbenchShellCommandModels(
      createOptions({
        showToast,
        pluginCommands: [{ id: "official.commands.test.run", title: "Run", category: "test" }],
        pluginKeybindings: [
          {
            id: "official.commands.test.run.keybinding",
            commandId: "official.commands.test.run",
            key: "mod+j",
          },
        ],
        hasPluginCommandHandler: () => true,
        runPluginCommand,
      }),
    )

    await expect(models.runCommand("official.commands.test.run", {})).rejects.toThrow(
      "plugin command failed",
    )

    const paletteEntry = models
      .commandItems()
      .find((entry) => entry.id === "official.commands.test.run")
    await paletteEntry?.action()
    expect(showToast).toHaveBeenCalledWith("plugin command failed")

    expect(models.shortcutRegistry().execute("mod+j")).toBe(true)
    await vi.waitFor(() => expect(showToast).toHaveBeenCalledTimes(2))
  })
})
