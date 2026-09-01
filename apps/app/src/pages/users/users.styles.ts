import * as stylex from "@stylexjs/stylex"

import { color, font } from "@tabora/theme/tokens.stylex"

export const styles = stylex.create({
  emailText: {
    color: color.text,
    fontSize: 13,
  },
  mono: {
    color: color.textSubtle,
    fontFamily: font.mono,
    fontSize: 11,
  },
})
