import * as stylex from "@stylexjs/stylex"
import type { CompiledStyles, InlineStyles, StyleXArray } from "@stylexjs/stylex"
import type { JSX } from "solid-js"

type XStyle = StyleXArray<
  (null | undefined | CompiledStyles) | boolean | Readonly<[CompiledStyles, InlineStyles]>
>

export const styles = stylex.create({
  cardRoot: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    minHeight: 0,
  },
  cardBody: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
    paddingInline: 2,
  },
  cardRow: {
    alignItems: "center",
    borderBottomColor: "rgb(var(--tbr-color-line))",
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    cursor: "pointer",
    display: "flex",
    gap: 8,
    paddingBlock: 8,
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "opacity",
    transitionTimingFunction: "var(--tbr-ease)",
    ":hover": {
      opacity: 0.7,
    },
  },
  cardRowLast: {
    borderBottomWidth: 0,
  },
  dot: {
    backgroundColor: "rgb(var(--tbr-color-line-strong))",
    borderRadius: "50%",
    flexShrink: 0,
    height: 5,
    width: 5,
  },
  dotStarred: {
    backgroundColor: "rgb(var(--tbr-color-accent))",
  },
  cardText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 1.4,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  time: {
    color: "rgb(var(--tbr-color-text-subtle))",
    flexShrink: 0,
    fontSize: 11,
    fontVariantNumeric: "tabular-nums",
  },
  cardFooter: {
    paddingBlockStart: 8,
    paddingInline: 2,
  },
  expandRoot: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    display: "flex",
    flex: 1,
    flexDirection: {
      default: "row",
      "@media (max-width: 720px)": "column",
    },
    minHeight: 0,
  },
  side: {
    backgroundColor: "rgb(var(--tbr-color-page))",
    borderBottomColor: {
      default: "transparent",
      "@media (max-width: 720px)": "rgb(var(--tbr-color-line))",
    },
    borderBottomStyle: "solid",
    borderBottomWidth: {
      default: 0,
      "@media (max-width: 720px)": 1,
    },
    borderRightColor: "rgb(var(--tbr-color-line))",
    borderRightStyle: "solid",
    borderRightWidth: {
      default: 1,
      "@media (max-width: 720px)": 0,
    },
    display: "flex",
    flexDirection: "column",
    flexShrink: 0,
    maxHeight: {
      default: "none",
      "@media (max-width: 720px)": 260,
    },
    overflowY: "auto",
    width: {
      default: 192,
      "@media (max-width: 720px)": "100%",
    },
  },
  sideSearch: {
    paddingBlock: 8,
    paddingInline: 12,
  },
  sideCalendar: {
    paddingBlockEnd: 8,
    paddingInline: 12,
  },
  sideSection: {
    paddingInline: 12,
  },
  sideSectionTitle: {
    color: "rgb(var(--tbr-color-text-subtle))",
    display: "block",
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: 0,
    paddingBlockEnd: 2,
    paddingBlockStart: 6,
    textTransform: "uppercase",
  },
  sideList: {
    paddingBlock: 2,
    paddingInline: 12,
  },
  sideTags: {
    paddingBlockEnd: 8,
    paddingInline: 12,
  },
  sideButton: {
    alignItems: "center",
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    borderRadius: "var(--tbr-radius-control)",
    color: "rgb(var(--tbr-color-text-muted))",
    cursor: "pointer",
    display: "flex",
    fontFamily: "inherit",
    fontSize: 12,
    gap: 6,
    minHeight: 28,
    paddingBlock: 3,
    paddingInline: 8,
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "background-color, color",
    transitionTimingFunction: "var(--tbr-ease)",
    width: "100%",
    ":hover": {
      backgroundColor: "rgb(var(--tbr-color-surface-hover))",
      color: "rgb(var(--tbr-color-text))",
    },
    ":focus-visible": {
      outline: "2px solid rgb(var(--tbr-color-focus))",
      outlineOffset: 1,
    },
  },
  sideButtonActive: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    color: "rgb(var(--tbr-color-accent))",
  },
  sideCount: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 10,
    marginLeft: "auto",
  },
  sideCountActive: {
    color: "rgb(var(--tbr-color-accent))",
  },
  sideHash: {
    color: "rgb(var(--tbr-color-text-subtle))",
    flexShrink: 0,
    fontWeight: 500,
  },
  sideHashActive: {
    color: "rgb(var(--tbr-color-accent))",
  },
  sideEmpty: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 11,
    paddingBlock: 3,
    paddingInline: 8,
  },
  main: {
    display: "flex",
    flex: 1,
    flexDirection: "column",
    minWidth: 0,
    overflowY: "auto",
    paddingBlock: 12,
    paddingInline: 16,
  },
  capture: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    borderStyle: "solid",
    borderWidth: 1,
    flexShrink: 0,
    marginBottom: 10,
    overflow: "hidden",
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "border-color, box-shadow",
    transitionTimingFunction: "var(--tbr-ease)",
    ":focus-within": {
      borderColor: "rgb(var(--tbr-color-accent))",
      boxShadow: "0 0 0 3px rgb(var(--tbr-color-accent) / 0.08)",
    },
  },
  captureInner: {
    alignItems: "flex-start",
    display: "flex",
    gap: 8,
    paddingBlockEnd: 4,
    paddingBlockStart: 8,
    paddingInline: 12,
  },
  textarea: {
    backgroundColor: "transparent",
    borderStyle: "none",
    borderWidth: 0,
    color: "rgb(var(--tbr-color-text))",
    flex: 1,
    fontFamily: "inherit",
    fontSize: 14,
    lineHeight: 1.45,
    minHeight: 36,
    outline: "none",
    paddingBlock: 2,
    resize: "vertical",
    width: "100%",
    "::placeholder": {
      color: "rgb(var(--tbr-color-text-subtle))",
    },
  },
  editTextarea: {
    minHeight: 100,
  },
  captureFooter: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    paddingBlockEnd: 8,
    paddingBlockStart: 4,
    paddingInline: 12,
  },
  savePill: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderRadius: "var(--tbr-radius-control)",
    color: "rgb(var(--tbr-color-text-muted))",
    display: "inline-flex",
    fontSize: 12,
    fontWeight: 600,
    gap: 4,
    height: 28,
    paddingInline: 12,
  },
  noteList: {
    flex: 1,
    minHeight: 0,
    overflowY: "auto",
  },
  note: {
    backgroundColor: "rgb(var(--tbr-color-surface))",
    borderColor: "rgb(var(--tbr-color-line))",
    borderRadius: "var(--tbr-radius-control)",
    borderStyle: "solid",
    borderWidth: 1,
    marginBottom: 8,
    overflow: "hidden",
    transitionDuration: "var(--tbr-dur-fast)",
    transitionProperty: "border-color",
    transitionTimingFunction: "var(--tbr-ease)",
    ":hover": {
      borderColor: "rgb(var(--tbr-color-line-strong))",
    },
  },
  noteEditing: {
    borderColor: "rgb(var(--tbr-color-accent))",
    boxShadow: "0 0 0 3px rgb(var(--tbr-color-accent) / 0.08)",
  },
  noteDisplay: {
    cursor: "pointer",
    paddingBlockEnd: 8,
    paddingBlockStart: 12,
    paddingInline: 16,
  },
  noteTime: {
    alignItems: "center",
    color: "rgb(var(--tbr-color-text-subtle))",
    display: "flex",
    fontSize: 12,
    gap: 6,
    lineHeight: 1.35,
    marginBottom: 4,
  },
  star: {
    color: "rgb(var(--tbr-color-accent))",
    display: "inline-flex",
  },
  noteContent: {
    color: "rgb(var(--tbr-color-text))",
    fontSize: 14,
    lineHeight: 1.45,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  highlight: {
    backgroundColor: "rgb(var(--tbr-color-accent) / 0.15)",
    borderRadius: 2,
    paddingInline: 1,
  },
  tags: {
    display: "flex",
    flexWrap: "wrap",
    gap: 4,
    marginTop: 4,
  },
  tag: {
    backgroundColor: "rgb(var(--tbr-color-accent-soft))",
    borderRadius: "var(--tbr-radius-pill)",
    color: "rgb(var(--tbr-color-accent))",
    fontSize: 11,
    paddingBlock: 1,
    paddingInline: 8,
  },
  noteFooter: {
    alignItems: "center",
    display: "flex",
    marginTop: 4,
  },
  meta: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 12,
  },
  actions: {
    display: "flex",
    gap: 2,
    marginLeft: "auto",
  },
  edit: {
    display: "flex",
    flexDirection: "column",
  },
  editArea: {
    paddingBlockEnd: 8,
    paddingBlockStart: 12,
    paddingInline: 16,
  },
  editFooter: {
    alignItems: "center",
    borderTopColor: "rgb(var(--tbr-color-line))",
    borderTopStyle: "solid",
    borderTopWidth: 1,
    display: "flex",
    justifyContent: "space-between",
    paddingBlock: 7,
    paddingInline: 14,
  },
  saved: {
    alignItems: "center",
    color: "rgb(var(--tbr-color-text-subtle))",
    display: "flex",
    fontSize: 12,
    gap: 4,
  },
  savedDot: {
    backgroundColor: "rgb(var(--tbr-color-accent))",
    borderRadius: "50%",
    height: 5,
    width: 5,
  },
  editButtons: {
    display: "flex",
    gap: 4,
  },
  empty: {
    paddingBlock: 24,
    paddingInline: 16,
    textAlign: "center",
  },
  emptyIcon: {
    color: "rgb(var(--tbr-color-text-subtle))",
    marginBottom: 8,
    opacity: 0.4,
  },
  emptyText: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 14,
  },
  emptyHint: {
    color: "rgb(var(--tbr-color-text-subtle))",
    fontSize: 12,
    marginTop: 4,
  },
})

export function sx(...values: XStyle[]): {
  class: string | undefined
  style: JSX.CSSProperties | undefined
} {
  const compiled = stylex.props(...values)
  return {
    class: compiled.className,
    style: compiled.style as JSX.CSSProperties | undefined,
  }
}
