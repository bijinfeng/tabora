import * as stylex from "@stylexjs/stylex"
export const demoStyles = stylex.create({
  section: {
    marginBottom: 12,
  },
  sectionRoomy: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: "var(--cp-text-subtle)",
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.06em",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  row: {
    alignItems: "center",
    display: "flex",
    flexWrap: "wrap",
    gap: 10,
  },
  rowCompact: {
    gap: 4,
  },
  rowStart: {
    alignItems: "flex-start",
    display: "flex",
    flexWrap: "wrap",
    gap: 8,
  },
  col: {
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  stack: {
    display: "grid",
    gap: 10,
    minWidth: 0,
  },
  stackCompact: {
    display: "grid",
    gap: 10,
    minWidth: 0,
  },
  controlStack: {
    display: "grid",
    gap: 10,
    minWidth: 0,
    width: "min(100%, 360px)",
  },
  relative: {
    minHeight: 150,
    position: "relative",
  },
  muted: {
    color: "var(--cp-text-muted)",
    fontSize: 13,
    lineHeight: 1.62,
  },
  inlineStatus: {
    alignItems: "center",
    color: "var(--cp-text-muted)",
    display: "inline-flex",
    fontSize: 13,
    gap: 6,
  },
  skeletonDemo: {
    alignItems: "start",
    display: "grid",
    gap: 12,
    gridTemplateColumns: "42px minmax(0, 1fr)",
    width: "min(100%, 320px)",
  },
  longList: {
    color: "var(--cp-text-muted)",
    display: "grid",
    fontSize: 13,
    gap: 6,
    paddingRight: 8,
  },
  truncateBox: {
    width: "min(100%, 280px)",
  },
  contextMenuContent: {
    backgroundColor: "var(--cp-surface-soft)",
    borderColor: "var(--cp-border)",
    borderRadius: "var(--tbr-radius-card)",
    borderStyle: "dashed",
    borderWidth: 1,
    color: "var(--cp-text-muted)",
    cursor: "context-menu",
    fontSize: 13,
    paddingBlock: 18,
    paddingInline: 20,
    textAlign: "center",
  },
  patternGrid: {
    display: "grid",
    gap: 14,
    gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
    "@media (max-width: 900px)": {
      gridTemplateColumns: "1fr",
    },
  },
  buttonGroup: {
    display: "inline-flex",
    gap: 0,
    isolation: "isolate",
  },
  progressLabel: {
    color: "var(--cp-text-muted)",
    display: "flex",
    fontSize: 11,
    justifyContent: "space-between",
    marginTop: 4,
  },
  toastRow: {
    alignItems: "flex-start",
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
})
