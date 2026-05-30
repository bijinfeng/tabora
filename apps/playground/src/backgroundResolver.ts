import type { BackgroundProviderContribution, ResolvedBackgroundValue } from "@tabora/plugin-api"

export const FALLBACK_BACKGROUND_ID = "background.gradient-green"

export function resolveBackgroundValue(
  providerId: string,
  providers: BackgroundProviderContribution[],
): ResolvedBackgroundValue | null {
  const provider = providers.find((p) => p.id === providerId)
  if (!provider) return null

  return {
    type: "css",
    css: provider.defaultCss ?? { background: "rgb(var(--color-page))" },
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
