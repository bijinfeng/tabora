import * as stylex from "@stylexjs/stylex"

import { color, space } from "@tabora/theme/tokens.stylex"

export const insertDialogStyles = stylex.create({
  body: {
    display: "flex",
    flexDirection: "column",
    gap: space.s3,
  },
  hint: {
    color: color.textMuted,
    fontSize: 12,
    lineHeight: "16px",
  },
  error: {
    color: color.danger,
    fontSize: 12,
    lineHeight: "16px",
  },
})
