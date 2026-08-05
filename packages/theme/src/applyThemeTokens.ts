import type { ThemeTokenSet } from "@tabora/plugin-api"

const TABORA_UI_TOKEN_PREFIXES = ["color-", "radius-", "control-", "dur-", "ease-"]
const TABORA_UI_TOKEN_ALIASES: Record<string, string[]> = {
  "color-muted": ["color-text-muted"],
  "color-subtle": ["color-text-subtle"],
}

const appliedProperties = new WeakMap<HTMLElement, Set<string>>()

export function applyThemeTokens(element: HTMLElement, tokens: ThemeTokenSet): void {
  const nextProperties = new Set<string>()
  for (const [name, value] of Object.entries(tokens)) {
    const property = `--${name}`
    element.style.setProperty(property, value)
    nextProperties.add(property)
    if (TABORA_UI_TOKEN_PREFIXES.some((prefix) => name.startsWith(prefix))) {
      const uiProperty = `--tbr-${name}`
      element.style.setProperty(uiProperty, value)
      nextProperties.add(uiProperty)
    }
    for (const alias of TABORA_UI_TOKEN_ALIASES[name] ?? []) {
      const aliasProperty = `--tbr-${alias}`
      element.style.setProperty(aliasProperty, value)
      nextProperties.add(aliasProperty)
    }
  }

  for (const property of appliedProperties.get(element) ?? []) {
    if (!nextProperties.has(property)) element.style.removeProperty(property)
  }
  appliedProperties.set(element, nextProperties)
}
