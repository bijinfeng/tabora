import * as stylex from "@stylexjs/stylex"

import { color, font, radius, space } from "@tabora/theme/tokens.stylex"

export const styles = stylex.create({
  page: {
    alignItems: "center",
    backgroundColor: color.page,
    color: color.text,
    display: "flex",
    fontFamily: font.sans,
    justifyContent: "center",
    minHeight: "100vh",
    padding: space.s5,
    width: "100%",
  },
  card: {
    backgroundColor: color.surface,
    borderColor: color.line,
    borderRadius: radius.panel,
    borderStyle: "solid",
    borderWidth: 1,
    boxShadow: "var(--tbr-shadow-sm)",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    gap: space.s6,
    maxWidth: 400,
    padding: space.s8,
    width: "100%",
  },
  header: {
    display: "flex",
    flexDirection: "column",
    gap: space.s2,
  },
  brandRow: {
    alignItems: "center",
    display: "flex",
    gap: space.s3,
    marginBottom: space.s2,
  },
  brandMark: {
    display: "block",
    flexShrink: 0,
    height: 28,
    width: 28,
  },
  brandName: {
    fontSize: 14,
    fontWeight: font.semibold,
  },
  title: {
    fontSize: 20,
    fontWeight: font.bold,
  },
  subtitle: {
    color: color.textMuted,
    fontSize: 13,
    lineHeight: 1.5,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: space.s5,
  },
  metaRow: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
  },
  footer: {
    color: color.textMuted,
    fontSize: 12,
    textAlign: "center",
  },
})
