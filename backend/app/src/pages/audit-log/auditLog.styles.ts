import * as stylex from "@stylexjs/stylex"

import { color, font, radius, space } from "@tabora/theme/tokens.stylex"

export const styles = stylex.create({
  filters: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: space.s3,
    padding: space.s4,
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
  },
  filterGroup: {
    display: "flex",
    flexDirection: "column",
    gap: space.s2,
  },
  filterLabel: {
    color: color.textMuted,
    fontSize: 12,
    fontWeight: font.medium,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    overflow: "hidden",
  },
  th: {
    paddingBlock: space.s3,
    paddingInline: space.s4,
    textAlign: "left",
    backgroundColor: color.surfaceSoft,
    borderBottomColor: color.line,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    color: color.textMuted,
    fontSize: 12,
    fontWeight: font.semibold,
  },
  td: {
    borderBottomColor: color.line,
    borderBottomStyle: "solid",
    borderBottomWidth: 1,
    fontSize: 13,
    paddingBlock: space.s3,
    paddingInline: space.s4,
  },
  tr: {
    ":hover": {
      backgroundColor: color.surfaceHover,
    },
  },
  pagination: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBlock: space.s3,
  },
  paginationInfo: {
    color: color.textMuted,
    fontSize: 12,
  },
  paginationButtons: {
    display: "flex",
    gap: space.s2,
  },
  badge: {
    display: "inline-block",
    backgroundColor: color.surfaceSoft,
    borderRadius: radius.r1,
    color: color.textMuted,
    fontSize: 11,
    fontWeight: font.medium,
    paddingBlock: space.s1,
    paddingInline: space.s2,
  },
  emptyState: {
    padding: space.s6,
    textAlign: "center",
    color: color.textMuted,
    fontSize: 13,
  },
  cleanupForm: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.s3,
    alignItems: "flex-end",
  },
  cleanupMessage: {
    color: color.textMuted,
    fontSize: 12,
    margin: 0,
  },
})
