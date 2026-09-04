import * as stylex from "@stylexjs/stylex"

import { color, font, radius, space } from "@tabora/theme/tokens.stylex"

export const styles = stylex.create({
  ownerText: {
    color: color.textMuted,
    fontSize: 12,
  },
  drawerBody: {
    display: "flex",
    flexDirection: "column",
    gap: space.s5,
  },
  metaGrid: {
    display: "grid",
    gap: space.s3,
    gridTemplateColumns: "auto 1fr",
  },
  metaLabel: {
    color: color.textMuted,
    fontSize: 12,
  },
  metaValue: {
    color: color.text,
    fontFamily: font.mono,
    fontSize: 12,
    wordBreak: "break-all",
  },
  jsonBlock: {
    backgroundColor: color.surfaceSoft,
    borderColor: color.line,
    borderRadius: radius.control,
    borderStyle: "solid",
    borderWidth: 1,
    color: color.text,
    fontFamily: font.mono,
    fontSize: 12,
    lineHeight: 1.5,
    margin: 0,
    maxHeight: 360,
    overflow: "auto",
    padding: space.s4,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
  },
  drawerFooter: {
    display: "flex",
    justifyContent: "flex-end",
  },
})
