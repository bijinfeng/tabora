import * as stylex from "@stylexjs/stylex"

export const color = stylex.defineVars({
  page: "rgb(var(--tbr-color-page))",
  surface: "rgb(var(--tbr-color-surface))",
  surfaceSoft: "rgb(var(--tbr-color-surface-soft))",
  surfaceHover: "rgb(var(--tbr-color-surface-hover))",
  text: "rgb(var(--tbr-color-text))",
  textSecondary: "rgb(var(--tbr-color-text-secondary))",
  textMuted: "rgb(var(--tbr-color-text-muted))",
  textSubtle: "rgb(var(--tbr-color-text-subtle))",
  line: "rgb(var(--tbr-color-line))",
  lineStrong: "rgb(var(--tbr-color-line-strong))",
  inverse: "rgb(var(--tbr-color-inverse))",
  shadow: "rgb(var(--tbr-color-shadow))",
  shadowStrong: "rgb(var(--tbr-color-shadow-strong))",
  scrim: "rgb(var(--tbr-color-scrim))",
  accent: "rgb(var(--tbr-color-accent))",
  accentHover: "rgb(var(--tbr-color-accent-hover))",
  accentSoft: "rgb(var(--tbr-color-accent-soft))",
  danger: "rgb(var(--tbr-color-danger))",
  dangerSoft: "rgb(var(--tbr-color-danger-soft))",
  success: "rgb(var(--tbr-color-success))",
  warning: "rgb(var(--tbr-color-warning))",
  info: "rgb(var(--tbr-color-info))",
  focus: "rgb(var(--tbr-color-focus))",
})

export const radius = stylex.defineVars({
  r1: "var(--tbr-radius-1)",
  r2: "var(--tbr-radius-2)",
  control: "var(--tbr-radius-control)",
  card: "var(--tbr-radius-card)",
  panel: "var(--tbr-radius-panel)",
  pill: "var(--tbr-radius-pill)",
})

export const space = stylex.defineVars({
  s1: "var(--tbr-space-1)",
  s2: "var(--tbr-space-2)",
  s3: "var(--tbr-space-3)",
  s4: "var(--tbr-space-4)",
  s5: "var(--tbr-space-5)",
  s6: "var(--tbr-space-6)",
  s8: "var(--tbr-space-8)",
})

export const motion = stylex.defineVars({
  fast: "var(--tbr-dur-fast)",
  normal: "var(--tbr-dur-normal)",
  ease: "var(--tbr-ease)",
})

export const font = stylex.defineVars({
  sans: "var(--tbr-font-sans)",
  mono: "var(--tbr-font-mono)",
  regular: "var(--tbr-font-weight-regular)",
  medium: "var(--tbr-font-weight-medium)",
  semibold: "var(--tbr-font-weight-semibold)",
  bold: "var(--tbr-font-weight-bold)",
  heavy: "var(--tbr-font-weight-heavy)",
})

export const shadow = stylex.defineVars({
  sm: "var(--tbr-shadow-sm)",
  md: "var(--tbr-shadow-md)",
  lg: "var(--tbr-shadow-lg)",
  xl: "var(--tbr-shadow-xl)",
  floating: "var(--tbr-shadow-floating)",
  dragging: "var(--tbr-shadow-dragging)",
})

export const zIndex = stylex.defineVars({
  base: "var(--tbr-z-base)",
  sticky: "var(--tbr-z-sticky)",
  dropdown: "var(--tbr-z-dropdown)",
  overlay: "var(--tbr-z-overlay)",
  modal: "var(--tbr-z-modal)",
  toast: "var(--tbr-z-toast)",
})
