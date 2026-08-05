import type { BackgroundProviderContribution, ResolvedBackgroundValue } from "@tabora/plugin-api"

const SAFE_BACKGROUND_STYLE = { background: "rgb(var(--color-page))" }
const appliedBackgroundProperties = new WeakMap<HTMLElement, Set<string>>()

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

export function applyBackgroundStyle(
  style: Record<string, string>,
  element: HTMLElement = document.body,
): void {
  const nextProperties = new Set(Object.keys(style))
  for (const property of appliedBackgroundProperties.get(element) ?? []) {
    if (!nextProperties.has(property)) element.style.removeProperty(property)
  }
  for (const [prop, value] of Object.entries(style)) {
    element.style.setProperty(prop, value)
  }
  appliedBackgroundProperties.set(element, nextProperties)
}
