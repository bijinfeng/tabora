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
    flexWrap: "wrap",
    gap: space.s3,
  },
  searchBox: {
    flex: 1,
    maxWidth: 320,
    minWidth: 200,
  },
  mono: {
    color: color.text,
    fontFamily: font.mono,
    fontSize: 12,
  },
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
  pagination: {
    alignItems: "center",
    color: color.textMuted,
    display: "flex",
    fontSize: 12,
    gap: space.s4,
    justifyContent: "flex-end",
  },
})
