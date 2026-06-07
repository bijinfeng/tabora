import type {
  SearchCommandEntry,
  SearchHistoryEntry,
  SearchProviderContribution,
  SearchWidgetEntry,
} from "@tabora/plugin-api"
import { matchProvidersByToken, routeSearchQuery } from "./search-model"

export type CommandPaletteItem = {
  id: string
  icon: string
  name: string
  desc: string
  group: string
  hint: string | undefined
  action: () => void
  closeAfterAction: boolean | undefined
}

export type CommandPaletteModelOptions = {
  surface?: "palette" | "inline" | undefined
  query: string
  commands: SearchCommandEntry[]
  widgets?: SearchWidgetEntry[] | undefined
  providers?: SearchProviderContribution[] | undefined
  defaultProviderId?: string | undefined
  history?: SearchHistoryEntry[] | undefined
  onProviderTokenSelect?: ((token: string) => void) | undefined
  onWebSearch?: ((provider: SearchProviderContribution, query: string) => void) | undefined
}

function includesText(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.toLowerCase())
}

function historyLabel(entry: SearchHistoryEntry, providers: SearchProviderContribution[]): string {
  return providers.find((provider) => provider.id === entry.providerId)?.title ?? entry.providerId
}

export function providerToken(provider: SearchProviderContribution): string {
  return provider.shortcut || provider.id.split(".").at(-1) || provider.title.toLowerCase()
}

export function createCommandPaletteItems(
  options: CommandPaletteModelOptions,
): CommandPaletteItem[] {
  const surface = options.surface ?? "palette"
  const trimmed = options.query.trim()
  const history = (options.history ?? []).slice().reverse()
  const providers = options.providers ?? []
  const widgets = options.widgets ?? []
  const defaultProviderId = options.defaultProviderId ?? ""

  function selectProvider(provider: SearchProviderContribution) {
    options.onProviderTokenSelect?.(providerToken(provider))
  }

  function runWebSearch(provider: SearchProviderContribution, query: string) {
    options.onWebSearch?.(provider, query)
  }

  if (!trimmed) {
    return [
      ...options.commands.slice(0, 4).map((command) => ({
        ...command,
        group: "常用命令",
        hint: command.shortcut,
        closeAfterAction: true,
      })),
      ...history.slice(0, surface === "inline" ? 3 : 4).map((entry) => {
        const provider = providers.find((item) => item.id === entry.providerId)
        return {
          id: `history-${entry.providerId}-${entry.timestamp}`,
          icon: "🕘",
          name: entry.query,
          desc: `最近搜索 · ${provider?.title ?? entry.providerId}`,
          group: "最近搜索",
          hint: provider?.shortcut,
          action: () => {
            if (provider) runWebSearch(provider, entry.query)
          },
          closeAfterAction: true,
        }
      }),
      ...providers.slice(0, 4).map((provider) => ({
        id: `provider-${provider.id}`,
        icon: "＠",
        name: `@${providerToken(provider)}`,
        desc: `搜索源 · ${provider.title}`,
        group: "搜索源",
        hint: provider.shortcut,
        action: () => selectProvider(provider),
        closeAfterAction: false,
      })),
      ...(surface === "inline"
        ? widgets.slice(0, 4).map((widget) => ({
            id: `widget-${widget.instanceId}`,
            icon: widget.icon,
            name: widget.name,
            desc: widget.desc,
            action: widget.action,
            group: "核心卡片",
            hint: undefined,
            closeAfterAction: true,
          }))
        : []),
    ]
  }

  const route = routeSearchQuery(trimmed, providers, defaultProviderId)
  if (route?.type === "provider-pending") {
    return matchProvidersByToken(providers, route.token).map((provider) => ({
      id: `provider-pending-${provider.id}`,
      icon: "＠",
      name: `@${providerToken(provider)}`,
      desc: `搜索源 · ${provider.title}`,
      group: "搜索源",
      hint: provider.shortcut,
      action: () => selectProvider(provider),
      closeAfterAction: false,
    }))
  }

  if (route?.type === "provider") {
    return [
      {
        id: `provider-search-${route.provider.id}`,
        icon: "🔍",
        name: `在 ${route.provider.title} 中搜索 "${route.query}"`,
        desc: "临时搜索源",
        group: "搜索",
        hint: route.provider.shortcut,
        action: () => runWebSearch(route.provider, route.query),
        closeAfterAction: true,
      },
    ]
  }

  const results: CommandPaletteItem[] = []
  results.push(
    ...options.commands
      .filter(
        (command) => includesText(command.name, trimmed) || includesText(command.desc, trimmed),
      )
      .map((command) => ({
        ...command,
        group: "命令",
        hint: command.shortcut,
        closeAfterAction: true,
      })),
  )
  results.push(
    ...widgets
      .filter((widget) => includesText(widget.name, trimmed) || includesText(widget.desc, trimmed))
      .map((widget) => ({
        id: `widget-${widget.instanceId}`,
        icon: widget.icon,
        name: widget.name,
        desc: widget.desc,
        action: widget.action,
        group: "卡片",
        hint: undefined,
        closeAfterAction: true,
      })),
  )
  if (surface === "inline") {
    results.push(
      ...history
        .filter(
          (entry) =>
            includesText(entry.query, trimmed) ||
            includesText(historyLabel(entry, providers), trimmed),
        )
        .slice(0, 3)
        .map((entry) => {
          const provider = providers.find((item) => item.id === entry.providerId)
          return {
            id: `history-${entry.providerId}-${entry.timestamp}`,
            icon: "🕘",
            name: entry.query,
            desc: `最近搜索 · ${historyLabel(entry, providers)}`,
            group: "最近搜索",
            hint: provider?.shortcut,
            action: () => {
              if (provider) runWebSearch(provider, entry.query)
            },
            closeAfterAction: true,
          }
        }),
    )
  }

  if (route?.type === "web") {
    results.push({
      id: `web-${route.provider.id}-${route.query}`,
      icon: "🔍",
      name: `在 ${route.provider.title} 中搜索 "${route.query}"`,
      desc: "网页搜索",
      group: "搜索",
      hint: route.provider.shortcut,
      action: () => runWebSearch(route.provider, route.query),
      closeAfterAction: true,
    })
  }

  return results
}
