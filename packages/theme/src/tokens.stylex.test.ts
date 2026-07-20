import { describe, expect, it } from "vitest"

import { color, font, motion, radius, shadow, space, zIndex } from "./tokens.stylex"

describe("StyleX semantic tokens", () => {
  it("defines the semantic token families through stylex.defineVars", () => {
    for (const value of [
      color.page,
      color.textMuted,
      radius.card,
      space.s4,
      motion.fast,
      font.sans,
      shadow.floating,
      zIndex.modal,
    ]) {
      expect(value).toMatch(/^var\(--/)
      expect(value).not.toContain("--tbr-")
    }
  })
})
