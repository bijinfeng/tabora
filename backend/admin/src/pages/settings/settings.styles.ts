import * as stylex from "@stylexjs/stylex"

import { color, font, radius, space } from "@tabora/theme/tokens.stylex"

export const styles = stylex.create({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: space.s8,
    margin: "0 auto",
    maxWidth: 720,
  },
  section: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    flexDirection: "column",
    gap: space.s5,
    padding: space.s6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: font.semibold,
  },
  sectionDesc: {
    color: color.textMuted,
    fontSize: 12,
    marginTop: `calc(-1 * ${space.s3})`,
  },
  row: {
    alignItems: "center",
    display: "flex",
    gap: space.s4,
    justifyContent: "space-between",
  },
  rowLabel: {
    color: color.text,
    fontSize: 13,
  },
  rowHelp: {
    color: color.textSubtle,
    fontSize: 11,
    marginTop: space.s1,
  },
  saveBar: {
    alignItems: "center",
    display: "flex",
    gap: space.s4,
    justifyContent: "flex-end",
    position: "sticky",
    bottom: 0,
  },
  savedHint: {
    color: color.success,
    fontSize: 12,
  },
})
