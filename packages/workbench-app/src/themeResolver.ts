import type { ThemeContribution, ThemeTokenSet } from "@tabora/plugin-api"

export const SAFE_THEME_TOKENS: ThemeTokenSet = {
  "color-page": "246 247 244",
  "color-surface": "255 255 255",
  "color-surface-soft": "250 250 248",
  "color-surface-hover": "242 244 240",
  "color-text": "28 30 28",
  "color-muted": "107 110 106",
  "color-subtle": "148 151 146",
  "color-inverse": "255 255 255",
  "color-shadow": "0 0 0",
  "color-shadow-strong": "15 23 18",
  "color-scrim": "8 10 8",
  "color-accent": "26 144 112",
  "color-accent-hover": "21 120 92",
  "color-accent-soft": "234 245 240",
  "color-line": "230 232 227",
  "color-line-strong": "209 212 206",
  "color-danger": "201 69 69",
  "color-success": "45 138 94",
  "radius-card": "8px",
}

export function resolveThemeTokens(themeId: string, themes: ThemeContribution[]): ThemeTokenSet {
  const theme = themes.find((item) => item.id === themeId)
  if (!theme) {
    console.warn(`Theme not found: "${themeId}", applying safe theme tokens`)
    return SAFE_THEME_TOKENS
  }

  return theme.tokens
}
