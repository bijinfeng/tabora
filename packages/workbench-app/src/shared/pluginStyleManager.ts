import type { PluginRecord } from "@tabora/plugin-api"
import type { BuiltinPlugin, ResolvedPluginStyle } from "@tabora/platform-kernel"

export type PluginStyleManager = {
  apply(styles: ResolvedPluginStyle[]): void
  dispose(): void
}

function styleKey(style: Pick<ResolvedPluginStyle, "pluginId" | "href">): string {
  return `${style.pluginId}\n${style.href}`
}

function byStyleOrder(left: ResolvedPluginStyle, right: ResolvedPluginStyle): number {
  return (
    left.order - right.order ||
    left.pluginId.localeCompare(right.pluginId) ||
    left.href.localeCompare(right.href)
  )
}

export function createPluginStyleManager(ownerDocument: Document): PluginStyleManager {
  const managedLinks = new Map<string, HTMLLinkElement>()

  function createLink(style: ResolvedPluginStyle): HTMLLinkElement {
    const link = ownerDocument.createElement("link")
    link.rel = "stylesheet"
    link.href = style.href
    link.dataset.taboraPluginStyle = style.pluginId
    link.dataset.taboraPluginStyleHref = style.sourceHref
    link.dataset.taboraStyleScope = style.scope
    link.dataset.taboraStyleSource = style.source
    return link
  }

  return {
    apply(styles) {
      const nextStyles = [...styles].sort(byStyleOrder)
      const nextKeys = new Set(nextStyles.map(styleKey))

      for (const [key, link] of managedLinks) {
        if (!nextKeys.has(key)) {
          link.remove()
          managedLinks.delete(key)
        }
      }

      for (const style of nextStyles) {
        const key = styleKey(style)
        const link = managedLinks.get(key) ?? createLink(style)
        if (!managedLinks.has(key)) {
          managedLinks.set(key, link)
        }
        ownerDocument.head.append(link)
      }
    },
    dispose() {
      for (const link of managedLinks.values()) {
        link.remove()
      }
      managedLinks.clear()
    },
  }
}

export function activePluginStyles(options: {
  styles: ResolvedPluginStyle[]
  plugins: BuiltinPlugin[]
  records?: Array<Pick<PluginRecord, "id" | "enabled" | "status">>
}): ResolvedPluginStyle[] {
  const pluginEnabledById = new Map(
    options.plugins.map((plugin) => [plugin.manifest.id, plugin.enabled]),
  )
  const recordEnabledById = new Map(
    (options.records ?? []).map((record) => [
      record.id,
      record.enabled && record.status !== "disabled" && record.status !== "skipped",
    ]),
  )

  return options.styles.filter((style) => {
    const enabled = recordEnabledById.get(style.pluginId) ?? pluginEnabledById.get(style.pluginId)
    return enabled === true
  })
}
