import * as stylex from "@stylexjs/stylex"

import { color, font, space } from "@tabora/theme/tokens.stylex"

export const styles = stylex.create({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: space.s6,
    margin: "0 auto",
    maxWidth: 1120,
  },
  toolbar: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
  },
  mono: {
    color: color.text,
    fontFamily: font.mono,
    fontSize: 12,
  },
  muted: {
    color: color.textMuted,
    fontSize: 12,
  },
  actionCell: {
    display: "flex",
    justifyContent: "flex-end",
  },
  formGrid: {
    display: "flex",
    flexDirection: "column",
    gap: space.s4,
  },
  footerRow: {
    alignItems: "center",
    display: "flex",
    gap: space.s3,
    justifyContent: "flex-end",
  },
  pagination: {
    alignItems: "center",
    color: color.textMuted,
    display: "flex",
    fontSize: 12,
    gap: space.s4,
    justifyContent: "flex-end",
  },
})
