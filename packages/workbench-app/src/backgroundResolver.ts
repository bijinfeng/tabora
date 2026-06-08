import type { BackgroundProviderContribution, ResolvedBackgroundValue } from "@tabora/plugin-api"

const SAFE_BACKGROUND_STYLE = { background: "rgb(var(--color-page))" }

export function resolveBackgroundValue(
  providerId: string,
  providers: BackgroundProviderContribution[],
): ResolvedBackgroundValue | null {
  const provider = providers.find((item) => item.id === providerId)
  if (!provider) return null

  if (provider.source) return provider.source
  return { type: "css", css: provider.defaultCss ?? SAFE_BACKGROUND_STYLE }
}

function styleForResolvedValue(value: ResolvedBackgroundValue): Record<string, string> {
  if (value.type === "css") return value.css
  if (value.type === "gradient") return { background: value.css }
  return SAFE_BACKGROUND_STYLE
}

export function resolveBackgroundStyle(
  providerId: string,
  providers: BackgroundProviderContribution[],
): Record<string, string> {
  const value = resolveBackgroundValue(providerId, providers)
  if (value) return styleForResolvedValue(value)

  return SAFE_BACKGROUND_STYLE
}

export function applyBackgroundStyle(style: Record<string, string>): void {
  for (const [prop, value] of Object.entries(style)) {
    ;(document.body.style as unknown as Record<string, string>)[prop] = value
  }
}
