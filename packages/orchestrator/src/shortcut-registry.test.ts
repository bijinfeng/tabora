import { describe, expect, it, vi } from "vitest"
import { createShortcutRegistry } from "./shortcut-registry"

describe("createShortcutRegistry", () => {
  it("detects conflicts and disables later bindings for the same key", () => {
    const registry = createShortcutRegistry({
      platform: "mac",
      keybindings: [
        { id: "platform.open-command", commandId: "open-command", key: "mod+k" },
        { id: "plugin.open-command", commandId: "plugin.open-command", key: "mod+k" },
      ],
      commands: {
        "open-command": vi.fn(),
        "plugin.open-command": vi.fn(),
      },
    })

    expect(registry.listConflicts()).toEqual([
      {
        key: "mod+k",
        winnerId: "platform.open-command",
        disabledId: "plugin.open-command",
        commandId: "plugin.open-command",
      },
    ])
    expect(registry.listBindings().map((binding) => [binding.id, binding.disabled])).toEqual([
      ["platform.open-command", false],
      ["plugin.open-command", true],
    ])
  })

  it("filters bindings by current platform", () => {
    const registry = createShortcutRegistry({
      platform: "linux",
      keybindings: [
        { id: "mac.open", commandId: "open-command", key: "mod+k", platform: "mac" },
        { id: "linux.open", commandId: "open-command", key: "ctrl+k", platform: "linux" },
        { id: "all.open", commandId: "open-command", key: "shift+k" },
      ],
      commands: {
        "open-command": vi.fn(),
      },
    })

    expect(registry.listBindings().map((binding) => binding.id)).toEqual(["linux.open", "all.open"])
  })

  it("does not execute disabled bindings", () => {
    const first = vi.fn()
    const second = vi.fn()
    const registry = createShortcutRegistry({
      platform: "mac",
      keybindings: [
        { id: "first.open", commandId: "first.open", key: "mod+k" },
        { id: "second.open", commandId: "second.open", key: "mod+k" },
      ],
      commands: {
        "first.open": first,
        "second.open": second,
      },
    })

    expect(registry.execute("mod+k")).toBe(true)

    expect(first).toHaveBeenCalledOnce()
    expect(second).not.toHaveBeenCalled()
  })

  it("exposes a shortcut reference list from enabled registry bindings", () => {
    const registry = createShortcutRegistry({
      platform: "mac",
      keybindings: [
        { id: "command.open", commandId: "open-command", key: "mod+k" },
        { id: "settings.open", commandId: "open-settings", key: "mod+," },
        { id: "settings.plugin", commandId: "plugin-settings", key: "mod+,", editable: true },
      ],
      commands: {
        "open-command": vi.fn(),
        "open-settings": vi.fn(),
        "plugin-settings": vi.fn(),
      },
    })

    expect(registry.listShortcutReferences()).toEqual([
      { id: "command.open", commandId: "open-command", key: "mod+k", editable: false },
      { id: "settings.open", commandId: "open-settings", key: "mod+,", editable: false },
    ])
  })
})
