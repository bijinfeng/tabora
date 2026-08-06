import * as stylex from "@stylexjs/stylex"

import { color, font, radius, space } from "@tabora/theme/tokens.stylex"

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
    gap: space.s4,
    justifyContent: "space-between",
  },
  toolbarLeft: {
    alignItems: "center",
    display: "flex",
    gap: space.s3,
    flex: 1,
    maxWidth: 360,
  },
  cell: {
    alignItems: "center",
    display: "flex",
    gap: space.s3,
  },
  emailText: {
    color: color.text,
    fontSize: 13,
  },
  mono: {
    color: color.textSubtle,
    fontFamily: font.mono,
    fontSize: 11,
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
  actionCell: {
    display: "flex",
    justifyContent: "flex-end",
  },
  banBanner: {
    backgroundColor: color.dangerSoft,
    borderRadius: radius.control,
    color: color.danger,
    fontSize: 12,
    padding: space.s2,
  },
})
