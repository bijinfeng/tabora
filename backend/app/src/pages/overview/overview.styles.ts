import * as stylex from "@stylexjs/stylex"

import { color, font, radius, space } from "@tabora/theme/tokens.stylex"

export const styles = stylex.create({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: space.s8,
    margin: "0 auto",
    maxWidth: 1120,
  },
  section: {
    display: "flex",
    flexDirection: "column",
    gap: space.s5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: font.semibold,
  },
  cardGrid: {
    display: "grid",
    gap: space.s5,
    gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
  },
  card: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    flexDirection: "column",
    gap: space.s3,
    padding: space.s5,
  },
  cardHead: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
  },
  cardLabel: {
    color: color.textMuted,
    fontSize: 13,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: font.bold,
    lineHeight: 1.2,
  },
  metricHint: {
    color: color.textSubtle,
    fontFamily: font.mono,
    fontSize: 12,
  },
})
