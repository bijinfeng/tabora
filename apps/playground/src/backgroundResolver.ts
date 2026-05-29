import type { BackgroundProviderContribution, ResolvedBackgroundValue } from "@tabora/plugin-api"

const BACKGROUND_STYLE_MAP: Record<string, Record<string, string>> = {
  "background.solid-green": {
    background: "rgb(237, 241, 238)",
  },
  "background.solid-dark": {
    background: "rgb(18, 18, 18)",
  },
  "background.gradient-green": {
    background:
      "linear-gradient(135deg, rgba(35, 113, 89, 0.18), transparent 32%), rgb(var(--color-page))",
  },
  "background.gradient-blue": {
    background:
      "linear-gradient(160deg, rgba(66, 133, 244, 0.15), transparent 40%), rgb(var(--color-page))",
  },
  "background.gradient-purple": {
    background:
      "linear-gradient(135deg, rgba(128, 90, 213, 0.15), transparent 35%), rgb(var(--color-page))",
  },
}

const FALLBACK_BACKGROUND_ID = "background.gradient-green"

export function resolveBackgroundValue(
  providerId: string,
  providers: BackgroundProviderContribution[],
): ResolvedBackgroundValue | null {
  const provider = providers.find((p) => p.id === providerId)
  if (!provider) return null

  const style = BACKGROUND_STYLE_MAP[providerId] ?? {
    background: "rgb(var(--color-page))",
  }

  return {
    type: "css",
    css: style,
  }
}

export function resolveBackgroundStyle(
  providerId: string,
  providers: BackgroundProviderContribution[],
): Record<string, string> {
  const value = resolveBackgroundValue(providerId, providers)
  if (value) return value.css

  const fallbackValue = resolveBackgroundValue(FALLBACK_BACKGROUND_ID, providers)
  if (fallbackValue) return fallbackValue.css

  return { background: "rgb(var(--color-page))" }
}

export function applyBackgroundStyle(style: Record<string, string>): void {
  for (const [prop, value] of Object.entries(style)) {
    ;(document.body.style as unknown as Record<string, string>)[prop] = value
  }
}

export { FALLBACK_BACKGROUND_ID }
