import type { ThemeTokenSet } from "@tabora/plugin-api"

export function applyThemeTokens(element: HTMLElement, tokens: ThemeTokenSet): void {
  for (const [name, value] of Object.entries(tokens)) {
    element.style.setProperty(`--${name}`, value)
  }
}
