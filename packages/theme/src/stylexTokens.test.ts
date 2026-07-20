import { describe, expect, it } from "vitest"

import { color, control, font, motion, radius, shadow, space, zIndex } from "./stylexTokens"

describe("StyleX token mappings", () => {
  it("maps semantic tokens to Tabora CSS custom properties", () => {
    expect(color.page).toBe("rgb(var(--tbr-color-page))")
    expect(color.surface).toBe("rgb(var(--tbr-color-surface))")
    expect(color.textMuted).toBe("rgb(var(--tbr-color-text-muted))")
    expect(radius.card).toBe("var(--tbr-radius-card)")
    expect(space[4]).toBe("var(--tbr-space-4)")
    expect(control.md).toBe("var(--tbr-control-md)")
    expect(motion.fast).toBe("var(--tbr-dur-fast)")
    expect(font.sans).toBe("var(--tbr-font-sans)")
    expect(shadow.floating).toBe("var(--tbr-shadow-floating)")
    expect(zIndex.modal).toBe("var(--tbr-z-modal)")
  })
})
