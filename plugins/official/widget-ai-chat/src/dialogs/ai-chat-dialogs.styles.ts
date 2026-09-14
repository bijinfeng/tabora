import * as stylex from "@stylexjs/stylex"

export const dialogStyles = stylex.create({
  contextList: {
    display: "grid",
    gap: 6,
  },
  contextItem: {
    alignItems: "center",
    backgroundColor: "rgb(var(--tbr-color-surface-soft))",
    borderRadius: "var(--tbr-radius-control)",
    display: "flex",
    gap: 8,
    padding: "6px 8px",
  },
  contextItemMain: {
    display: "grid",
    flex: 1,
    gap: 2,
    minWidth: 0,
  },
  contextItemLabel: {
    color: "rgb(var(--tbr-color-text))",
    fontSize: 12,
    fontWeight: 600,
  },
  contextItemPreview: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 11,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  optionsForm: {
    display: "grid",
    gap: 12,
  },
  optionsLabel: {
    display: "grid",
    gap: 4,
  },
  optionsLabelText: {
    color: "rgb(var(--tbr-color-text-muted))",
    fontSize: 12,
    fontWeight: 600,
  },
  optionsHint: {
    color: "rgb(var(--tbr-color-danger))",
    fontSize: 11,
  },
})
