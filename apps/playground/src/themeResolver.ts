import type { ThemeContribution, ThemeTokenSet } from "@tabora/plugin-api"

export function resolveThemeTokens(themeId: string, themes: ThemeContribution[]): ThemeTokenSet {
  const theme = themes.find((t) => t.id === themeId)
  if (!theme) {
    console.warn(`Theme not found: "${themeId}", falling back to first available theme`)
    const fallback = themes[0]
    return fallback?.tokens ?? {}
  }
  return theme.tokens
}
