import * as stylex from "@stylexjs/stylex"

export const color = stylex.defineVars({
  page: "rgb(var(--tbr-color-page))",
  surface: "rgb(var(--tbr-color-surface))",
  surfaceSoft: "rgb(var(--tbr-color-surface-soft))",
  surfaceHover: "rgb(var(--tbr-color-surface-hover))",
  text: "rgb(var(--tbr-color-text))",
  textMuted: "rgb(var(--tbr-color-text-muted))",
  textSubtle: "rgb(var(--tbr-color-text-subtle))",
  line: "rgb(var(--tbr-color-line))",
  lineStrong: "rgb(var(--tbr-color-line-strong))",
  inverse: "rgb(var(--tbr-color-inverse))",
  accent: "rgb(var(--tbr-color-accent))",
  accentHover: "rgb(var(--tbr-color-accent-hover))",
  accentSoft: "rgb(var(--tbr-color-accent-soft))",
  danger: "rgb(var(--tbr-color-danger))",
  dangerSoft: "rgb(var(--tbr-color-danger-soft))",
  warning: "rgb(var(--tbr-color-warning))",
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

export const motion = stylex.defineVars({
  fast: "var(--tbr-dur-fast)",
  normal: "var(--tbr-dur-normal)",
  ease: "var(--tbr-ease)",
})

export const font = stylex.defineVars({
  sans: "var(--tbr-font-sans)",
  mono: "var(--tbr-font-mono)",
  medium: "var(--tbr-font-weight-medium)",
  semibold: "var(--tbr-font-weight-semibold)",
  bold: "var(--tbr-font-weight-bold)",
})

export const shadow = stylex.defineVars({
  md: "var(--tbr-shadow-md)",
  floating: "var(--tbr-shadow-floating)",
  dragging: "var(--tbr-shadow-dragging)",
})

export const zIndex = stylex.defineVars({
  sticky: "var(--tbr-z-sticky)",
  dropdown: "var(--tbr-z-dropdown)",
  overlay: "var(--tbr-z-overlay)",
  modal: "var(--tbr-z-modal)",
  toast: "var(--tbr-z-toast)",
})

export const space = stylex.defineVars({
  s2: "var(--tbr-space-2)",
  s3: "var(--tbr-space-3)",
  s4: "var(--tbr-space-4)",
  s5: "var(--tbr-space-5)",
  s6: "var(--tbr-space-6)",
})
