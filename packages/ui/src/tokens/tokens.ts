export const TOKEN = {
  color: {
    page: "tbr-color-page",
    surface: "tbr-color-surface",
    text: "tbr-color-text",
    muted: "tbr-color-text-muted",
    subtle: "tbr-color-text-subtle",
    inverse: "tbr-color-inverse",
    shadow: "tbr-color-shadow",
    shadowStrong: "tbr-color-shadow-strong",
    scrim: "tbr-color-scrim",
    accent: "tbr-color-accent",
    accentHover: "tbr-color-accent-hover",
    accentSoft: "tbr-color-accent-soft",
    line: "tbr-color-line",
    danger: "tbr-color-danger",
    success: "tbr-color-success",
    warning: "tbr-color-warning",
    info: "tbr-color-info",
    focus: "tbr-color-focus",
  },
  radius: {
    control: "tbr-radius-control",
    card: "tbr-radius-card",
    panel: "tbr-radius-panel",
  },
  space: {
    xs: "tbr-space-2",
    sm: "tbr-space-3",
    md: "tbr-space-5",
    lg: "tbr-space-8",
  },
  control: {
    sm: "tbr-control-sm",
    md: "tbr-control-md",
    lg: "tbr-control-lg",
  },
  duration: {
    fast: "tbr-dur-fast",
    normal: "tbr-dur-normal",
  },
  ease: {
    standard: "tbr-ease",
  },
} as const

export type TokenName = (typeof TOKEN)[keyof typeof TOKEN] extends infer T
  ? T extends Record<string, string>
    ? T[keyof T]
    : never
  : never
