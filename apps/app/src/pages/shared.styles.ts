import * as stylex from "@stylexjs/stylex"

import { color, font, space } from "@tabora/theme/tokens.stylex"

/** 后台列表页共享的布局与文本样式，供多个 page/dialog 复用。 */
export const shared = stylex.create({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: space.s5,
    width: "100%",
  },
  pageHeader: {
    display: "flex",
    flexDirection: "column",
    gap: space.s2,
  },
  pageTitle: {
    fontSize: 18,
    fontWeight: font.semibold,
    lineHeight: 1.2,
    margin: 0,
  },
  pageDescription: {
    color: color.textMuted,
    fontSize: 13,
    lineHeight: 1.45,
    margin: 0,
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
  actionCell: {
    display: "flex",
    justifyContent: "flex-end",
  },
  mono: {
    color: color.text,
    fontFamily: font.mono,
    fontSize: 12,
  },
})
