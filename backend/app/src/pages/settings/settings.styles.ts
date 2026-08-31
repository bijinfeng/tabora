import * as stylex from "@stylexjs/stylex"

import { color, font, radius, space } from "@tabora/theme/tokens.stylex"

export const styles = stylex.create({
  page: {
    display: "flex",
    flexDirection: "column",
    gap: space.s5,
    margin: "0 auto",
    maxWidth: 720,
    paddingBottom: 72,
  },
  section: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    flexDirection: "column",
    gap: space.s4,
    padding: space.s5,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: font.semibold,
    margin: 0,
  },
  sectionDesc: {
    color: color.textMuted,
    fontSize: 12,
    margin: 0,
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
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.card,
    borderStyle: "solid",
    borderWidth: 1,
    display: "flex",
    gap: space.s4,
    justifyContent: "flex-end",
    position: "sticky",
    bottom: 0,
    padding: space.s3,
  },
  savedHint: {
    color: color.success,
    fontSize: 12,
  },
})
