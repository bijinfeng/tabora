import { describe, expect, it } from "vitest"
import type { BackgroundProviderContribution } from "@tabora/plugin-api"
import {
  FALLBACK_BACKGROUND_ID,
  resolveBackgroundStyle,
  resolveBackgroundValue,
} from "./backgroundResolver"

function makeProvider(
  id: string,
  title: string,
  css?: Record<string, string>,
): BackgroundProviderContribution {
  return {
    id,
    title,
    sourceType: "generated",
    defaultCss: css ?? {
      background: `linear-gradient(135deg, rgba(0,0,0,0.1), transparent), rgb(var(--color-page))`,
    },
  }
}

describe("resolveBackgroundValue", () => {
  const providers = [
    makeProvider("background.gradient-green", "渐变绿", {
      background: "linear-gradient(135deg, green, transparent)",
    }),
    makeProvider("background.gradient-blue", "渐变蓝", {
      background: "linear-gradient(135deg, blue, transparent)",
    }),
  ]

  it("resolves CSS value for known provider", () => {
    const resolved = resolveBackgroundValue("background.gradient-green", providers)
    expect(resolved).not.toBeNull()
    expect(resolved!.type).toBe("css")
    expect(resolved!.css).toHaveProperty("background")
    expect(resolved!.css.background).toContain("linear-gradient")
  })

  it("returns null for unknown provider ID", () => {
    const resolved = resolveBackgroundValue("unknown.bg", providers)
    expect(resolved).toBeNull()
  })

  it("resolves fallback when provider is not in list", () => {
    const resolved = resolveBackgroundValue("background.gradient-green", [])
    expect(resolved).toBeNull()
  })
})

describe("resolveBackgroundStyle", () => {
  const providers = [
    makeProvider("background.gradient-green", "渐变绿"),
    makeProvider("background.solid-dark", "暗色"),
  ]

  it("resolves style from known provider ID", () => {
    const style = resolveBackgroundStyle("background.gradient-green", providers)
    expect(style).toHaveProperty("background")
    expect(style.background).toContain("linear-gradient")
  })

  it("falls back to default when provider ID is unknown", () => {
    const style = resolveBackgroundStyle("unknown.bg", providers)
    expect(style).toHaveProperty("background")
  })

  it("returns minimal fallback when no providers match", () => {
    const style = resolveBackgroundStyle("any-id", [])
    expect(style).toHaveProperty("background")
    expect(style.background).toBe("rgb(var(--color-page))")
  })
})

describe("FALLBACK_BACKGROUND_ID", () => {
  it("is a known provider ID", () => {
    expect(FALLBACK_BACKGROUND_ID).toBe("background.gradient-green")
  })
})
