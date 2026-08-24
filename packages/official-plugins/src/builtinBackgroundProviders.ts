import type { BackgroundProviderContribution } from "@tabora/plugin-api/sdk"

/** Synthetic plugin id retained so persisted background settings refs keep resolving. */
export const BUILTIN_BACKGROUND_PROVIDER_PLUGIN_ID = "official.background.basic"

type RgbTriplet = readonly [number, number, number]

const PAGE_BACKGROUND = "rgb(var(--color-page))"

function cssRgb(triplet: RgbTriplet) {
  return ["rgb", "(", triplet.join(" "), ")"].join("")
}

function cssTint(triplet: RgbTriplet, alpha: number) {
  return ["rgb", "(", triplet.join(" "), " / ", String(alpha), ")"].join("")
}

function cssGradient(angle: string, tint: RgbTriplet, alpha: number, stop: string) {
  return [
    "linear-gradient(",
    angle,
    ", ",
    cssTint(tint, alpha),
    ", transparent ",
    stop,
    "), ",
    PAGE_BACKGROUND,
  ].join("")
}

function buildSolidBackground(triplet: RgbTriplet) {
  const background = cssRgb(triplet)
  return {
    source: { type: "css" as const, css: { background } },
    defaultCss: { background },
  }
}

function buildGradientBackground(angle: string, tint: RgbTriplet, alpha: number, stop: string) {
  const background = cssGradient(angle, tint, alpha, stop)
  return {
    source: { type: "gradient" as const, css: background },
    defaultCss: { background },
  }
}

export const builtinBackgroundProviders: BackgroundProviderContribution[] = [
  {
    id: "background.solid-green",
    title: "纯色绿底",
    sourceType: "generated",
    ...buildSolidBackground([237, 241, 238]),
  },
  {
    id: "background.solid-dark",
    title: "纯色暗底",
    sourceType: "generated",
    ...buildSolidBackground([18, 18, 18]),
  },
  {
    id: "background.gradient-green",
    title: "渐变绿底",
    sourceType: "generated",
    ...buildGradientBackground("135deg", [35, 113, 89], 0.18, "32%"),
  },
  {
    id: "background.gradient-blue",
    title: "渐变蓝底",
    sourceType: "generated",
    ...buildGradientBackground("160deg", [66, 133, 244], 0.15, "40%"),
  },
  {
    id: "background.gradient-purple",
    title: "渐变紫底",
    sourceType: "generated",
    ...buildGradientBackground("135deg", [128, 90, 213], 0.15, "35%"),
  },
]
