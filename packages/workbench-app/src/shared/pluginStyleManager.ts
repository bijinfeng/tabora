import type { PluginRecord } from "@tabora/plugin-api"
import type { ResolvedPluginStyle } from "@tabora/platform-kernel"

export type PluginStyleManager = {
  apply(styles: ResolvedPluginStyle[]): void
  dispose(): void
}

export type PluginStyleManagerOptions = {
  fetchCss?: (href: string) => Promise<string>
}

type ManagedStyle = {
  node?: HTMLLinkElement | HTMLStyleElement
  generation: number
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

function cssScopeSelector(pluginId: string): string {
  return `[data-tabora-plugin-id="${pluginId.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"]`
}

function splitSelectors(selectorText: string): string[] {
  const selectors: string[] = []
  let start = 0
  let parentheses = 0
  let brackets = 0
  let quote: "'" | '"' | null = null

  for (let index = 0; index < selectorText.length; index += 1) {
    const char = selectorText[index]
    if (!char) continue
    if (quote) {
      if (char === "\\") index += 1
      else if (char === quote) quote = null
      continue
    }
    if (char === "'" || char === '"') {
      quote = char
      continue
    }
    if (char === "(") parentheses += 1
    else if (char === ")") parentheses -= 1
    else if (char === "[") brackets += 1
    else if (char === "]") brackets -= 1
    else if (char === "," && parentheses === 0 && brackets === 0) {
      selectors.push(selectorText.slice(start, index))
      start = index + 1
    }
  }
  selectors.push(selectorText.slice(start))
  return selectors
}

function scopeRuleSelectors(selectorText: string, scope: string): string {
  return splitSelectors(selectorText)
    .map((selector) => {
      const trimmed = selector.trim()
      if (!trimmed) return trimmed
      if (
        /(^|[\s>+~])(:root|html|body|:host)(?=$|[\s>+~.#[:])/u.test(trimmed) ||
        trimmed.includes(":global(")
      ) {
        throw new Error(`Scoped plugin styles may not target global selector "${trimmed}"`)
      }
      return `${scope} ${trimmed}`
    })
    .join(", ")
}

function findMatchingBrace(source: string, openIndex: number): number {
  let depth = 0
  let quote: "'" | '"' | null = null
  for (let index = openIndex; index < source.length; index += 1) {
    const char = source[index]
    if (!char) continue
    if (quote) {
      if (char === "\\") index += 1
      else if (char === quote) quote = null
      continue
    }
    if (char === "'" || char === '"') {
      quote = char
      continue
    }
    if (char === "{") depth += 1
    else if (char === "}") {
      depth -= 1
      if (depth === 0) return index
    }
  }
  throw new Error("Scoped plugin stylesheet has an unclosed block")
}

function scopeCssRules(source: string, scope: string): string {
  let output = ""
  let cursor = 0

  while (cursor < source.length) {
    const openIndex = source.indexOf("{", cursor)
    if (openIndex === -1) return output + source.slice(cursor)
    const header = source.slice(cursor, openIndex)
    const closeIndex = findMatchingBrace(source, openIndex)
    const body = source.slice(openIndex + 1, closeIndex)
    const trimmedHeader = header.trim()

    if (trimmedHeader.startsWith("@")) {
      if (/^@(keyframes|font-face|property|page)\b/iu.test(trimmedHeader)) {
        throw new Error(`Scoped plugin styles may not declare global rule "${trimmedHeader}"`)
      }
      output += `${header}{${scopeCssRules(body, scope)}}`
    } else {
      output += `${scopeRuleSelectors(header, scope)}{${body}}`
    }
    cursor = closeIndex + 1
  }

  return output
}

/**
 * Prefix raw plugin stylesheet selectors with the plugin's host-owned rendering boundary.
 * Keyframes, root selectors and similar global CSS are rejected instead of being silently unsafe.
 */
export function scopePluginCss(css: string, pluginId: string): string {
  return scopeCssRules(css, cssScopeSelector(pluginId))
}

export function createPluginStyleManager(
  ownerDocument: Document,
  options: PluginStyleManagerOptions = {},
): PluginStyleManager {
  const managedStyles = new Map<string, ManagedStyle>()
  const fetchCss =
    options.fetchCss ??
    (async (href: string) => {
      const response = await fetch(href)
      if (!response.ok) throw new Error(`Failed to load plugin stylesheet: ${response.status}`)
      return response.text()
    })

  function createGlobalLink(style: ResolvedPluginStyle): HTMLLinkElement {
    const link = ownerDocument.createElement("link")
    link.rel = "stylesheet"
    link.href = style.href
    link.dataset.taboraPluginStyle = style.pluginId
    link.dataset.taboraPluginStyleHref = style.sourceHref
    link.dataset.taboraStyleScope = style.scope
    link.dataset.taboraStyleSource = style.source
    return link
  }

  async function mountScopedStyle(
    style: ResolvedPluginStyle,
    key: string,
    generation: number,
  ): Promise<void> {
    try {
      const css = await fetchCss(style.href)
      const managed = managedStyles.get(key)
      if (!managed || managed.generation !== generation) return
      const node = ownerDocument.createElement("style")
      node.dataset.taboraPluginStyle = style.pluginId
      node.dataset.taboraPluginStyleHref = style.sourceHref
      node.dataset.taboraStyleScope = style.scope
      node.dataset.taboraStyleSource = style.source
      node.textContent = scopePluginCss(css, style.pluginId)
      managed.node = node
      ownerDocument.head.append(node)
    } catch (error) {
      console.error(
        `Failed to apply scoped stylesheet for plugin "${style.pluginId}":`,
        error instanceof Error ? error.message : String(error),
      )
    }
  }

  return {
    apply(styles) {
      const nextStyles = [...styles].sort(byStyleOrder)
      const nextKeys = new Set(nextStyles.map(styleKey))

      for (const [key, managed] of managedStyles) {
        if (!nextKeys.has(key)) {
          managed.node?.remove()
          managedStyles.delete(key)
        }
      }

      for (const style of nextStyles) {
        const key = styleKey(style)
        if (managedStyles.has(key)) continue
        const managed: ManagedStyle = { generation: 1 }
        managedStyles.set(key, managed)
        if (style.scope === "global") {
          const node = createGlobalLink(style)
          managed.node = node
          ownerDocument.head.append(node)
        } else {
          void mountScopedStyle(style, key, managed.generation)
        }
      }
    },
    dispose() {
      for (const managed of managedStyles.values()) {
        managed.node?.remove()
      }
      managedStyles.clear()
    },
  }
}

export function activePluginStyles(options: {
  styles: ResolvedPluginStyle[]
  plugins: Array<{
    manifest: { id: string; [key: string]: unknown }
    enabled: boolean
    [key: string]: unknown
  }>
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
