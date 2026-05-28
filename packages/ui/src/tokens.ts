export const TOKENS = {
  page: "color-page",
  surface: "color-surface",
  text: "color-text",
  muted: "color-muted",
  accent: "color-accent",
  line: "color-line",
  radiusCard: "radius-card",
} as const

export type TokenName = (typeof TOKENS)[keyof typeof TOKENS]
