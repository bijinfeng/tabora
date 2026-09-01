import * as stylex from "@stylexjs/stylex"

import { color, font, radius, space } from "@tabora/theme/tokens.stylex"

export const styles = stylex.create({
  cleanupField: {
    display: "flex",
    flexDirection: "column",
    gap: space.s2,
  },
  cleanupLabel: {
    color: color.textMuted,
    fontSize: 12,
    fontWeight: font.medium,
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
