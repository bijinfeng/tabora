import type { ThemeTokenSet } from "@tabora/plugin-api"

const TABORA_UI_TOKEN_PREFIXES = ["color-", "radius-", "control-", "dur-", "ease-"]
const TABORA_UI_TOKEN_ALIASES: Record<string, string[]> = {
  "color-muted": ["color-text-muted"],
  "color-subtle": ["color-text-subtle"],
}

export function applyThemeTokens(element: HTMLElement, tokens: ThemeTokenSet): void {
  for (const [name, value] of Object.entries(tokens)) {
    element.style.setProperty(`--${name}`, value)
    if (TABORA_UI_TOKEN_PREFIXES.some((prefix) => name.startsWith(prefix))) {
      element.style.setProperty(`--tbr-${name}`, value)
    }
    for (const alias of TABORA_UI_TOKEN_ALIASES[name] ?? []) {
      element.style.setProperty(`--tbr-${alias}`, value)
    }
  }
}
