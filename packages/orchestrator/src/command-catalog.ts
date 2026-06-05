import type { CommandContribution, SearchCommandEntry } from "@tabora/plugin-api"

export type CommandActionMap = Record<string, (() => void) | undefined>

export type CommandCatalogOptions = {
  platformCommands: CommandContribution[]
  pluginCommands?: CommandContribution[]
  actions?: CommandActionMap
  supportedCapabilities?: string[]
}

export type CommandCatalog = {
  listCommandEntries(): SearchCommandEntry[]
}

function hasRequiredCapabilities(
  command: CommandContribution,
  supportedCapabilities: Set<string> | undefined,
): boolean {
  if (!command.requiredCapabilities?.length) return true
  if (!supportedCapabilities) return true
  return command.requiredCapabilities.every((capability) => supportedCapabilities.has(capability))
}

function comparePluginCommands(left: CommandContribution, right: CommandContribution): number {
  return left.category.localeCompare(right.category) || left.title.localeCompare(right.title)
}

function commandDescription(command: CommandContribution): string {
  const description = command.description ?? command.category
  if (!command.keywords?.length) return description
  return `${description} · ${command.keywords.join(" ")}`
}

function toCommandEntry(
  command: CommandContribution,
  actions: CommandActionMap,
): SearchCommandEntry {
  const entry: SearchCommandEntry = {
    id: command.id,
    icon: command.icon ?? "",
    name: command.title,
    desc: commandDescription(command),
    action: actions[command.id] ?? (() => {}),
  }

  if (command.defaultShortcut) {
    entry.shortcut = command.defaultShortcut
  }

  return entry
}

export function createCommandPaletteCommands(options: CommandCatalogOptions): SearchCommandEntry[] {
  const actions = options.actions ?? {}
  const supportedCapabilities = options.supportedCapabilities
    ? new Set(options.supportedCapabilities)
    : undefined
  const platformCommands = options.platformCommands.filter((command) =>
    hasRequiredCapabilities(command, supportedCapabilities),
  )
  const pluginCommands = (options.pluginCommands ?? [])
    .filter((command) => hasRequiredCapabilities(command, supportedCapabilities))
    .sort(comparePluginCommands)

  return [...platformCommands, ...pluginCommands].map((command) => toCommandEntry(command, actions))
}

export function createCommandCatalog(options: CommandCatalogOptions): CommandCatalog {
  return {
    listCommandEntries: () => createCommandPaletteCommands(options),
  }
}
