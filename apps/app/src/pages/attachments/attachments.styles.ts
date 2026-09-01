import * as stylex from "@stylexjs/stylex"

import { color } from "@tabora/theme/tokens.stylex"

export const styles = stylex.create({
  toolbar: {
    alignItems: "center",
    display: "flex",
    justifyContent: "space-between",
  },
  muted: {
    color: color.textMuted,
    fontSize: 12,
  },
})
