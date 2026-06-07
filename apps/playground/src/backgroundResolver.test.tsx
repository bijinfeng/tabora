import { describe, expect, it } from "vitest"
import type { BackgroundProviderContribution } from "@tabora/plugin-api"
import {
  FALLBACK_BACKGROUND_ID,
  resolveBackgroundStyle,
  resolveBackgroundValue,
} from "@tabora/workbench-app"

function cssFunction(name: "rgb" | "rgba", args: string) {
  return [name, `(${args})`].join("")
}

function cssRgb(channels: readonly number[]) {
  return cssFunction("rgb", channels.join(", "))
}

function cssRgba(channels: readonly number[], alpha: number) {
  return cssFunction("rgba", [...channels, alpha].join(","))
}

function gradientBackground(tint: string) {
  return `linear-gradient(135deg, ${tint}, transparent), rgb(var(--color-page))`
}

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
      background: gradientBackground(cssRgba([0, 0, 0], 0.1)),
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
    if (resolved?.type !== "css") throw new Error("Expected css background")
    expect(resolved.css).toHaveProperty("background")
    expect(resolved.css.background).toContain("linear-gradient")
  })

  it("prefers explicit css source over defaultCss", () => {
    const resolved = resolveBackgroundValue("background.css-source", [
      {
        id: "background.css-source",
        title: "CSS Source",
        sourceType: "generated",
        source: {
          type: "css",
          css: { background: cssRgb([1, 2, 3]) },
        },
        defaultCss: { background: cssRgb([4, 5, 6]) },
      },
    ])

    expect(resolved).toEqual({ type: "css", css: { background: cssRgb([1, 2, 3]) } })
  })

  it("resolves gradient, image, video, and canvas sources", () => {
    const sources: BackgroundProviderContribution[] = [
      {
        id: "background.gradient-source",
        title: "Gradient Source",
        sourceType: "generated",
        source: {
          type: "gradient",
          css: "linear-gradient(135deg, red, blue)",
        },
      },
      {
        id: "background.image-source",
        title: "Image Source",
        sourceType: "remote",
        source: {
          type: "image",
          url: "https://example.com/image.jpg",
          fit: "cover",
        },
      },
      {
        id: "background.video-source",
        title: "Video Source",
        sourceType: "remote",
        source: {
          type: "video",
          url: "https://example.com/video.mp4",
        },
      },
      {
        id: "background.canvas-source",
        title: "Canvas Source",
        sourceType: "generated",
        source: {
          type: "canvas",
          view: "background.canvas.view",
        },
      },
    ]

    expect(resolveBackgroundValue("background.gradient-source", sources)).toEqual({
      type: "gradient",
      css: "linear-gradient(135deg, red, blue)",
    })
    expect(resolveBackgroundValue("background.image-source", sources)).toEqual({
      type: "image",
      url: "https://example.com/image.jpg",
      fit: "cover",
    })
    expect(resolveBackgroundValue("background.video-source", sources)).toEqual({
      type: "video",
      url: "https://example.com/video.mp4",
    })
    expect(resolveBackgroundValue("background.canvas-source", sources)).toEqual({
      type: "canvas",
      view: "background.canvas.view",
    })
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

  it("uses safe fallback style when a non-css source has no renderer", () => {
    const style = resolveBackgroundStyle("background.image-source", [
      {
        id: "background.image-source",
        title: "Image Source",
        sourceType: "remote",
        source: {
          type: "image",
          url: "https://example.com/image.jpg",
        },
      },
    ])

    expect(style).toEqual({ background: "rgb(var(--color-page))" })
  })

  it("renders gradient source as css background", () => {
    const style = resolveBackgroundStyle("background.gradient-source", [
      {
        id: "background.gradient-source",
        title: "Gradient Source",
        sourceType: "generated",
        source: {
          type: "gradient",
          css: "linear-gradient(135deg, red, blue)",
        },
      },
    ])

    expect(style).toEqual({ background: "linear-gradient(135deg, red, blue)" })
  })
})

describe("FALLBACK_BACKGROUND_ID", () => {
  it("is a known provider ID", () => {
    expect(FALLBACK_BACKGROUND_ID).toBe("background.gradient-green")
  })
})
