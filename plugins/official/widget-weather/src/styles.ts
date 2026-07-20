import * as stylex from "@stylexjs/stylex"
import type { CompiledStyles, InlineStyles, StyleXArray } from "@stylexjs/stylex"
import type { JSX } from "solid-js"

type XStyle = StyleXArray<
  (null | undefined | CompiledStyles) | boolean | Readonly<[CompiledStyles, InlineStyles]>
>

export const styles = stylex.create({
  root: { display: "flex", flexDirection: "column", height: "100%", minHeight: 0 },
  body: { display: "flex", flex: 1, flexDirection: "column", gap: 10, minHeight: 0 },
  stack: { display: "grid", gap: 8 },
  now: { alignItems: "center", display: "flex", gap: 12 },
  temp: {
    color: "rgb(var(--tbr-color-text))",
    fontSize: 34,
    fontVariantNumeric: "tabular-nums",
    fontWeight: 650,
    lineHeight: 1,
  },
  copy: { display: "grid", gap: 2, minWidth: 0 },
  title: { color: "rgb(var(--tbr-color-text))", fontSize: 13, fontWeight: 650 },
  muted: { color: "rgb(var(--tbr-color-text-muted))", fontSize: 11 },
  metrics: {
    display: "grid",
    gap: 6,
    gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  },
  metric: {
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    borderStyle: "solid",
    borderWidth: 1,
    display: "grid",
    gap: 2,
    padding: 7,
  },
  value: { color: "rgb(var(--tbr-color-text))", fontSize: 12, fontWeight: 650 },
  hours: {
    display: "grid",
    gap: 6,
    gridTemplateColumns: "repeat(auto-fit, minmax(44px, 1fr))",
    overflow: "hidden",
  },
  hour: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderRadius: "var(--tbr-radius-control)",
    display: "grid",
    fontSize: 10,
    gap: 3,
    justifyItems: "center",
    paddingBlock: 6,
    paddingInline: 4,
  },
  expand: { height: "100%", minHeight: 0 },
  expandBody: {
    display: "grid",
    gap: 14,
    gridTemplateColumns: {
      default: "minmax(0, 1fr) 220px",
      "@media (max-width: 680px)": "1fr",
    },
    height: "100%",
    minHeight: 0,
    padding: 16,
  },
  main: { alignContent: "start", display: "grid", gap: 12, minWidth: 0 },
  side: {
    alignContent: "start",
    display: { default: "grid", "@media (max-width: 680px)": "none" },
    gap: 10,
  },
  nowPanel: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-panel)",
    borderStyle: "solid",
    borderWidth: 1,
    display: "grid",
    gap: 10,
    gridTemplateColumns: "48px auto minmax(0, 1fr) auto",
    padding: 12,
  },
  icon: { color: "rgb(var(--tbr-color-accent))", display: "grid", placeItems: "center" },
  aqi: { alignItems: "end", display: "grid", gap: 2, justifyItems: "end" },
  panel: {
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-panel)",
    borderStyle: "solid",
    borderWidth: 1,
    overflow: "hidden",
  },
  panelHead: {
    alignItems: "center",
    borderBottomColor: "rgb(var(--tbr-color-line))",
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    color: "rgb(var(--tbr-color-text-muted))",
    display: "flex",
    fontSize: 11,
    justifyContent: "space-between",
    paddingBlock: 8,
    paddingInline: 10,
  },
  list: { display: "grid" },
  row: {
    alignItems: "center",
    borderBottomColor: "rgb(var(--tbr-color-line))",
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    display: "grid",
    gap: 10,
    gridTemplateColumns: "72px minmax(0, 1fr) auto",
    minHeight: 40,
    paddingInline: 10,
  },
  rowText: {
    alignItems: "center",
    color: "rgb(var(--tbr-color-text-muted))",
    display: "inline-flex",
    fontSize: 11,
    gap: 5,
  },
  rowMeta: { color: "rgb(var(--tbr-color-text-subtle))", fontSize: 11, fontStyle: "normal" },
  advice: { gridTemplateColumns: "56px minmax(0, 1fr) auto" },
  sidePanel: {
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-panel)",
    borderStyle: "solid",
    borderWidth: 1,
    display: "grid",
    gap: 8,
    padding: 10,
  },
  miniGrid: { display: "grid", gap: 6, gridTemplateColumns: "repeat(2, minmax(0, 1fr))" },
  mini: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderRadius: "var(--tbr-radius-control)",
    display: "grid",
    gap: 2,
    padding: 8,
  },
})

export function sx(...values: XStyle[]): {
  class: string | undefined
  style: JSX.CSSProperties | undefined
} {
  const compiled = stylex.props(...values)
  return { class: compiled.className, style: compiled.style as JSX.CSSProperties | undefined }
}
