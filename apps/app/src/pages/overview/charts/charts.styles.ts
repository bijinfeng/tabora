import * as stylex from "@stylexjs/stylex"

import { color, font, radius, shadow, space, motion } from "@tabora/theme/tokens.stylex"

export const chartStyles = stylex.create({
  grid: {
    display: "grid",
    gap: space.s5,
    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
  },
  card: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    flexDirection: "column",
    gap: space.s4,
    padding: space.s5,
    transitionProperty: "box-shadow, border-color",
    transitionDuration: motion.normal,
    ":hover": {
      boxShadow: shadow.lg,
    },
  },
  cardHead: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
    minHeight: 20,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: font.semibold,
  },
  canvas: {
    minHeight: 220,
    width: "100%",
  },
  loading: {
    alignItems: "center",
    color: color.textMuted,
    display: "flex",
    fontSize: 13,
    justifyContent: "center",
    minHeight: 220,
  },
  legend: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.s4,
  },
  legendItem: {
    alignItems: "center",
    color: color.textMuted,
    display: "flex",
    fontSize: 12,
    gap: space.s2,
  },
  legendSwatch: {
    borderRadius: radius.r1,
    height: 10,
    width: 10,
  },
})
