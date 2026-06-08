import { uniq } from "es-toolkit/array"
import type { KeybindingContribution } from "@tabora/plugin-api"

export type ShortcutCommandMap = Record<string, (() => void) | undefined>

export type ShortcutRegistryOptions = {
  platform: string
  keybindings?: KeybindingContribution[]
  platformKeybindings?: KeybindingContribution[]
  pluginKeybindings?: KeybindingContribution[]
  commands?: ShortcutCommandMap
  executeCommand?: (commandId: string) => void
}

export type ShortcutBinding = KeybindingContribution & {
  key: string
  disabled: boolean
}

export type ShortcutConflict = {
  key: string
  winnerId: string
  disabledId: string
  commandId: string
}

export type ShortcutReference = {
  id: string
  commandId: string
  key: string
  editable: boolean
}

export type ShortcutRegistry = {
  execute(key: string): boolean
  executeKeydown(
    event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey">,
  ): boolean
  listBindings(): ShortcutBinding[]
  listConflicts(): ShortcutConflict[]
  listShortcutReferences(): ShortcutReference[]
}

function normalizePlatform(platform: string): string {
  const value = platform.toLowerCase()
  if (value === "darwin" || value === "macos" || value === "osx") return "mac"
  if (value === "win32" || value === "win") return "windows"
  return value
}

function matchesPlatform(binding: KeybindingContribution, platform: string): boolean {
  if (!binding.platform) return true
  return normalizePlatform(binding.platform) === normalizePlatform(platform)
}

export function normalizeShortcutKey(key: string): string {
  const parts = key
    .split("+")
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean)

  const modifiers = new Set<string>()
  let primary = ""

  for (const part of parts) {
    if (part === "cmd" || part === "command" || part === "meta") {
      modifiers.add("mod")
    } else if (part === "control") {
      modifiers.add("ctrl")
    } else if (part === "option") {
      modifiers.add("alt")
    } else if (part === "mod" || part === "ctrl" || part === "alt" || part === "shift") {
      modifiers.add(part)
    } else {
      primary = part
    }
  }

  return [...["mod", "ctrl", "alt", "shift"].filter((modifier) => modifiers.has(modifier)), primary]
    .filter(Boolean)
    .join("+")
}

export function shortcutKeyFromEvent(
  event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey">,
): string {
  return shortcutKeysFromEvent(event)[0] ?? normalizeShortcutKey(event.key)
}

export function shortcutKeysFromEvent(
  event: Pick<KeyboardEvent, "key" | "metaKey" | "ctrlKey" | "altKey" | "shiftKey">,
): string[] {
  const modifiers: string[] = []
  if (event.metaKey) modifiers.push("mod")
  if (event.ctrlKey) modifiers.push("ctrl")
  if (event.altKey) modifiers.push("alt")
  if (event.shiftKey) modifiers.push("shift")

  const explicitKey = normalizeShortcutKey([...modifiers, event.key].join("+"))
  if (!event.ctrlKey) return [explicitKey]

  const modModifiers = modifiers.map((modifier) => (modifier === "ctrl" ? "mod" : modifier))
  const modKey = normalizeShortcutKey([...modModifiers, event.key].join("+"))
  return uniq([explicitKey, modKey])
}

export function createShortcutRegistry(options: ShortcutRegistryOptions): ShortcutRegistry {
  const commands = options.commands ?? {}
  const executeCommand = options.executeCommand ?? ((commandId: string) => commands[commandId]?.())
  const acceptedBindings = [
    ...(options.platformKeybindings ?? []),
    ...(options.pluginKeybindings ?? []),
    ...(options.keybindings ?? []),
  ].filter((binding) => matchesPlatform(binding, options.platform))

  const enabledByKey = new Map<string, ShortcutBinding>()
  const conflicts: ShortcutConflict[] = []
  const bindings = acceptedBindings.map((binding): ShortcutBinding => {
    const key = normalizeShortcutKey(binding.key)
    const winner = enabledByKey.get(key)
    const resolved = { ...binding, key, disabled: Boolean(winner) }

    if (winner) {
      conflicts.push({
        key,
        winnerId: winner.id,
        disabledId: binding.id,
        commandId: binding.commandId,
      })
    } else {
      enabledByKey.set(key, resolved)
    }

    return resolved
  })
  function executeNormalizedKey(key: string): boolean {
    const binding = enabledByKey.get(normalizeShortcutKey(key))
    if (!binding || binding.disabled) return false
    executeCommand(binding.commandId)
    return true
  }

  return {
    execute(key) {
      return executeNormalizedKey(key)
    },
    executeKeydown(event) {
      return shortcutKeysFromEvent(event).some((key) => executeNormalizedKey(key))
    },
    listBindings: () => [...bindings],
    listConflicts: () => [...conflicts],
    listShortcutReferences: () =>
      bindings
        .filter((binding) => !binding.disabled)
        .map((binding) => ({
          id: binding.id,
          commandId: binding.commandId,
          key: binding.key,
          editable: binding.editable ?? false,
        })),
  }
}
